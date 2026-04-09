const axios = require('axios');

const TOPICS = {
  'AI & Tech': 'artificial intelligence technology',
  'Wars & Conflicts': 'war conflict',
  'Politics': 'politics government',
  'Business & Economy': 'business economy markets',
};

async function fetchNews() {
  const apiKey = process.env.NEWSAPI_KEY;
  const results = {};

  for (const [label, query] of Object.entries(TOPICS)) {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: query,
        pageSize: 3,
        sortBy: 'publishedAt',
        language: 'en',
        apiKey,
      },
    });

    results[label] = response.data.articles.map((a) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      image: a.urlToImage || null,
      source: a.source?.name || 'Unknown',
      publishedAt: a.publishedAt,
    }));
  }

  return results;
}

module.exports = { fetchNews };
