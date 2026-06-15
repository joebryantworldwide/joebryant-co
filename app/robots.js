// Explicitly welcome every major search and AI crawler so the site is
// fully indexable by Google/Bing and discoverable inside AI answers
// (ChatGPT, Claude, Perplexity, Gemini, Copilot, Meta AI).
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "Bingbot",
  "DuckAssistBot",
  "cohere-ai",
  "CCBot",
  "meta-externalagent",
  "Amazonbot",
];

export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: "https://joebryant.co/sitemap.xml",
    host: "https://joebryant.co",
  };
}
