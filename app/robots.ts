import { Metadata } from 'next';

export default async function robots() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cotizador-next-eight.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}