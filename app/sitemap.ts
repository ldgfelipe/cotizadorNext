export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const urls = [
    { url: '/', changefreq: 'daily' as const, priority: 1 },
    { url: '/quoter', changefreq: 'weekly' as const, priority: 0.8 },
    { url: '/credits', changefreq: 'weekly' as const, priority: 0.8 },
    { url: '/dashboard', changefreq: 'monthly' as const, priority: 0.7 },
    { url: '/contacto', changefreq: 'monthly' as const, priority: 0.5 },
    { url: '/aviso-privacidad', changefreq: 'yearly' as const, priority: 0.3 },
  ];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cotizador-next-eight.vercel.app';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url>\n    <loc>${siteUrl}${u.url}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')}\n</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}