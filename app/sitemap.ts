export default async function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cotizador-next-eight.vercel.app';

  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/quoter`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/credits`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/dashboard`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/contacto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/aviso-privacidad`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}