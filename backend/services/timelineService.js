const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TOPIC_QUERIES = {
  'ai-tech':  'artificial intelligence technology',
  'wars':     'war conflict',
  'politics': 'politics government',
  'business': 'business economy markets',
};

function sevenDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
}

async function fetchTimeline(topicKey) {
  const query = TOPIC_QUERIES[topicKey] || topicKey;

  const response = await axios.get('https://api.nytimes.com/svc/search/v2/articlesearch.json', {
    params: {
      q:          query,
      begin_date: sevenDaysAgo(),
      sort:       'oldest',
      'api-key':  process.env.NYTIMES_API_KEY,
    },
  });

  const articles = (response.data.response?.docs || []).slice(0, 5);
  if (articles.length === 0) return null;

  const articleText = articles
    .map((a, i) => {
      const date = a.pub_date?.split('T')[0] || '';
      return `Article ${i + 1} (${date}): ${a.headline?.main || ''}\n${a.abstract || a.snippet || ''}`;
    })
    .join('\n\n');

  const prompt = `These are New York Times articles about the same ongoing story published over the past 7 days, ordered oldest to newest. Analyze how the story developed and return ONLY a JSON object:
{
  "story_topic": "what this story is about in one sentence",
  "timeline": [
    {
      "date": "YYYY-MM-DD",
      "headline": "what happened on this date",
      "development": "one sentence explaining what changed or was revealed",
      "significance": "Low / Medium / High"
    }
  ],
  "current_status": "one sentence summary of where the story stands today",
  "trajectory": "Escalating / De-escalating / Stable / Resolved"
}

Articles:
${articleText}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
}

module.exports = { fetchTimeline, TOPIC_QUERIES };
