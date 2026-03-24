import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://whitemeta.cn';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/login/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
