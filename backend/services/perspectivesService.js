const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TOPIC_QUERIES = {
  'AI & Tech':          'artificial intelligence technology',
  'Wars & Conflicts':   'war conflict',
  'Politics':           'politics government',
  'Business & Economy': 'business economy markets',
};

async function fetchArticlesForTopic(query) {
  const response = await axios.get('https://api.nytimes.com/svc/search/v2/articlesearch.json', {
    params: {
      q: query,
      sort: 'newest',
      'api-key': process.env.NYTIMES_API_KEY,
    },
  });

  return (response.data.response?.docs || []).slice(0, 4).map(a => ({
    title:       a.headline?.main || '',
    description: a.abstract || a.snippet || '',
    source:      a.source || 'The New York Times',
    section:     a.section_name || '',
    url:         a.web_url,
  }));
}

async function comparePerspectives(topic) {
  const query = TOPIC_QUERIES[topic];
  const articles = await fetchArticlesForTopic(query);
  if (articles.length < 2) return null;

  const articleText = articles
    .map((a, i) => `Article ${i + 1} [${a.section}]: ${a.title}\n${a.description}`)
    .join('\n\n');

  const prompt = `These are ${articles.length} New York Times articles covering related aspects of the same broad story. Compare the angles and return ONLY a JSON object:
{
  "story_title": "one sentence describing what the overall story is about",
  "perspectives": [
    {
      "source": "New York Times",
      "region": "region this angle focuses on (e.g. US, Europe, Global)",
      "angle": "2 sentence description of how this article frames the story differently",
      "bias": "Left / Right / Centre / Neutral"
    }
  ],
  "key_difference": "one sentence explaining the most significant difference in how these articles approach the story"
}

Articles:
${articleText}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 768,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
}

async function fetchAllPerspectives() {
  const results = {};
  for (const topic of Object.keys(TOPIC_QUERIES)) {
    results[topic] = await comparePerspectives(topic);
  }
  return results;
}

module.exports = { fetchAllPerspectives };
