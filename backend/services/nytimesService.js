const axios = require('axios');

// Maps our topic labels to NYTimes Top Stories sections
const TOPIC_SECTIONS = {
  'AI & Tech':          'technology',
  'Wars & Conflicts':   'world',
  'Politics':           'us',
  'Business & Economy': 'business',
};

function pickImage(multimedia) {
  if (!multimedia || !multimedia.length) return null;
  // Prefer a medium-sized image; fall back to first available
  const preferred = multimedia.find(m => m.format === 'mediumThreeByTwo440')
    || multimedia.find(m => m.format === 'Large')
    || multimedia[0];
  return preferred?.url || null;
}

async function fetchNews() {
  const apiKey = process.env.NYTIMES_API_KEY;
  const results = {};

  for (const [label, section] of Object.entries(TOPIC_SECTIONS)) {
    const response = await axios.get(
      `https://api.nytimes.com/svc/topstories/v2/${section}.json`,
      { params: { 'api-key': apiKey } }
    );

    results[label] = response.data.results.slice(0, 3).map(a => ({
      title:       a.title,
      description: a.abstract,
      url:         a.url,
      image:       pickImage(a.multimedia),
      source:      'The New York Times',
      publishedAt: a.published_date,
    }));
  }

  return results;
}

module.exports = { fetchNews };
