import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://taskmint-iota.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin"],
      },
      {
        userAgent: [
          "Googlebot",
          "Google-Extended", // Google Gemini & AI Overviews
          "GPTBot",          // OpenAI ChatGPT & SearchGPT
          "PerplexityBot",   // Perplexity AI Search
          "ClaudeBot",       // Anthropic Claude
          "Applebot",        // Apple Intelligence & Siri
          "Bingbot",         // Microsoft Copilot & Bing
        ],
        allow: "/",
        disallow: ["/api/", "/admin"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
