const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

let cachedArticles = null;

function setCache(articles) {
  cachedArticles = articles;
}

function getCache() {
  return cachedArticles;
}

function articlesToText(groupedArticles) {
  const lines = [];
  for (const [topic, articles] of Object.entries(groupedArticles)) {
    lines.push(`--- ${topic} ---`);
    for (const a of articles) {
      lines.push(`Source: ${a.source}`);
      lines.push(`Title: ${a.title}`);
      if (a.description) lines.push(`Description: ${a.description}`);
      if (a.summary) lines.push(`Summary: ${a.summary}`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

function extractSources(groupedArticles) {
  const sources = new Set();
  for (const articles of Object.values(groupedArticles)) {
    for (const a of articles) {
      if (a.source) sources.add(a.source);
    }
  }
  return [...sources];
}

async function askQuestion(question) {
  const articles = cachedArticles;

  if (!articles) {
    return {
      answer: "No articles have been loaded yet. Please fetch today's news first.",
      sources: [],
    };
  }

  const articleText = articlesToText(articles);
  const sources = extractSources(articles);

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system:
      "You are BriefAI, a news assistant. Answer the user's question using ONLY the news articles provided. Do not use any outside knowledge. If the answer is not in the articles, say 'I don't have enough information on that in today's news.' Keep your answer to 3-4 sentences maximum. Be direct and factual.",
    messages: [
      {
        role: 'user',
        content: `User question: ${question}\n\nAvailable articles:\n${articleText}`,
      },
    ],
  });

  return {
    answer: message.content[0].text.trim(),
    sources,
  };
}

module.exports = { askQuestion, setCache, getCache };
