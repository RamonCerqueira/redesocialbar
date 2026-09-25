import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/restaurante/pirambeira'],
      disallow: ['/admin', '/moderacao', '/api'],
    },
    sitemap: 'https://tonopiramba.com.br/sitemap.xml',
  };
}
