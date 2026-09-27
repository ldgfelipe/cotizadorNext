import { Metadata } from 'next';

export default async function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cotizador-next-eight.vercel.app';

  const urls = [
    { url: siteUrl, changefreq: 'daily', priority: 1 },
    { url: `${siteUrl}/quoter`, changefreq: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/credits`, changefreq: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/dashboard`, changefreq: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/contacto`, changefreq: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/aviso-privacidad`, changefreq: 'yearly', priority: 0.3 },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.url}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
  });
}