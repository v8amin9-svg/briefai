const express = require('express');
const router = express.Router();
const { fetchNews: fetchNewsAPI } = require('../services/newsService');
const { fetchNews: fetchNYTimes } = require('../services/nytimesService');

function fetchNews() {
  const source = process.env.NEWS_SOURCE || 'newsapi';
  if (source === 'nytimes') return fetchNYTimes();
  return fetchNewsAPI();
}
const { analyzeAllArticles } = require('../services/aiService');
const { fetchAllPerspectives } = require('../services/perspectivesService');
const { fetchTimeline } = require('../services/timelineService');
const { askQuestion, setCache } = require('../services/chatService');
const cache = require('../services/cacheService');
const demoData = require('../data/demoData.json');

const isDemo = () => process.env.DEMO_MODE === 'true';

// Background refresh: fetch + analyze and store in cache
async function refreshNewsCache() {
  if (isDemo()) return;
  try {
    console.log('[Cache] Refreshing news cache...');
    const articles = await fetchNews();
    const enriched = await analyzeAllArticles(articles);
    cache.set('analyzed', enriched);
    setCache(enriched);
    console.log('[Cache] News cache refreshed successfully.');
  } catch (err) {
    console.error('[Cache] Refresh failed:', err.message);
  }
}

async function refreshPerspectivesCache() {
  if (isDemo()) return;
  try {
    console.log('[Cache] Refreshing perspectives cache...');
    const perspectives = await fetchAllPerspectives();
    cache.set('perspectives', perspectives);
    console.log('[Cache] Perspectives cache refreshed.');
  } catch (err) {
    console.error('[Cache] Perspectives refresh failed:', err.message);
  }
}

// News cache refreshes every 30 min (~192 NYTimes API calls/day, within 4k limit)
// Perspectives cache refreshes every 2 hours (heavy: 4 topics × Claude analysis)
const THIRTY_MIN = 30 * 60 * 1000;
const TWO_HOURS  =  2 * 60 * 60 * 1000;

setTimeout(() => {
  refreshNewsCache();
  setInterval(refreshNewsCache, THIRTY_MIN);
}, 5000);

setTimeout(() => {
  refreshPerspectivesCache();
  setInterval(refreshPerspectivesCache, TWO_HOURS);
}, 15000);

// GET /api/mode
router.get('/mode', (req, res) => {
  res.json({ mode: isDemo() ? 'DEMO' : 'LIVE' });
});

// GET /api/news/analyzed
router.get('/news/analyzed', async (req, res) => {
  try {
    if (isDemo()) {
      setCache(demoData.analyzed);
      return res.json({ data: demoData.analyzed, mode: 'DEMO', updatedAt: null, cacheAgeMinutes: 0 });
    }

    const cached = cache.get('analyzed');
    if (cached) {
      return res.json({ data: cached.value, mode: 'LIVE', updatedAt: cached.updatedAt, cacheAgeMinutes: cache.getAge('analyzed') });
    }

    // No cache yet — fetch now
    const articles = await fetchNews();
    const enriched = await analyzeAllArticles(articles);
    cache.set('analyzed', enriched);
    setCache(enriched);
    res.json({ data: enriched, mode: 'LIVE', updatedAt: Date.now(), cacheAgeMinutes: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to analyze news', detail: err.message });
  }
});

// GET /api/news (raw, no AI)
router.get('/news', async (req, res) => {
  try {
    if (isDemo()) return res.json(demoData.analyzed);
    const articles = await fetchNews();
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch news', detail: err.message });
  }
});

// GET /api/perspectives
router.get('/perspectives', async (req, res) => {
  try {
    if (isDemo()) return res.json({ data: demoData.perspectives, mode: 'DEMO', cacheAgeMinutes: 0 });

    const cached = cache.get('perspectives');
    if (cached) {
      return res.json({ data: cached.value, mode: 'LIVE', cacheAgeMinutes: cache.getAge('perspectives') });
    }

    const perspectives = await fetchAllPerspectives();
    cache.set('perspectives', perspectives);
    res.json({ data: perspectives, mode: 'LIVE', cacheAgeMinutes: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch perspectives', detail: err.message });
  }
});

// GET /api/timeline?topic=wars
router.get('/timeline', async (req, res) => {
  const topic = req.query.topic || 'wars';
  try {
    if (isDemo()) {
      const data = demoData.timeline[topic] || demoData.timeline['wars'];
      return res.json({ data, mode: 'DEMO' });
    }
    const cacheKey = `timeline_${topic}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ data: cached.value, mode: 'LIVE', cacheAgeMinutes: cache.getAge(cacheKey) });

    const timeline = await fetchTimeline(topic);
    cache.set(cacheKey, timeline);
    res.json({ data: timeline, mode: 'LIVE', cacheAgeMinutes: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timeline', detail: err.message });
  }
});

// GET /api/article?url=...
router.get('/article', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url is required' });
  try {
    const { extract } = await import('article-parser');
    const article = await extract(decodeURIComponent(url));
    if (!article) return res.status(404).json({ error: 'Could not parse article' });

    // Convert HTML content to plain text with paragraph breaks
    const rawHtml = article.content || '';
    const text = rawHtml
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    res.json({
      title: article.title || '',
      text,
      description: article.description || '',
      published: article.published || null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch article', detail: err.message });
  }
});

// POST /api/ask
router.post('/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });
  try {
    if (isDemo()) setCache(demoData.analyzed);
    const result = await askQuestion(question);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to process question', detail: err.message });
  }
});

module.exports = router;
