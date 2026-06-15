import { getPosts } from "../../lib/journal";

export const dynamic = "force-static";

export async function GET() {
  const posts = getPosts();
  const items = posts
    .map(
      (p) => `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>https://joebryant.co/journal/${p.slug}</link>
      <guid>https://joebryant.co/journal/${p.slug}</guid>
      <pubDate>${new Date(p.date + "T12:00:00Z").toUTCString()}</pubDate>
      <description><![CDATA[${p.description}]]></description>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Journal — Joe Bryant, Architectural Photographer</title>
    <link>https://joebryant.co/journal</link>
    <description>Notes on architectural photography — twilight technique, interiors, estates and craft.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
