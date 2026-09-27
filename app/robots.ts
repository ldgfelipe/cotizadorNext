export const dynamic = 'force-dynamic';

export default async function robots() {
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\n\nSitemap: ${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cotizador-next-eight.vercel.app'}/sitemap.xml`,
    { headers: { 'Content-Type': 'text/plain' } }
  );
}