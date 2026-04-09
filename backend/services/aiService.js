const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function analyzeArticle(article) {
  const prompt = `Analyze this news article and return ONLY a JSON object with no extra text:
{
  "summary": "3 sentence plain English summary of the article",
  "political_leaning": "Left Wing / Right Wing / Centre / Neutral",
  "region_focus": "which region of the world this article focuses on",
  "country_bias": "which country's perspective this article favors, or Neutral",
  "tone": "Neutral / Alarming / Promotional / Investigative",
  "trending_score": a number from 1-10 indicating how major this story is,
  "read_time_saved": estimated minutes saved by reading the summary instead of full article
}

Article title: ${article.title}
Article description: ${article.description || 'No description available'}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
}

async function analyzeAllArticles(groupedArticles) {
  const enriched = {};

  for (const [topic, articles] of Object.entries(groupedArticles)) {
    enriched[topic] = [];
    for (const article of articles) {
      const analysis = await analyzeArticle(article);
      enriched[topic].push({ ...article, ...analysis });
      await sleep(300);
    }
  }

  return enriched;
}

module.exports = { analyzeAllArticles };
