export const dynamic = 'force-dynamic';

export default async function robots() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cotizador-next-eight.vercel.app';

  const txt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: ${siteUrl}/sitemap.xml`;

  return new Response(txt, {
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=3600' },
  });
}