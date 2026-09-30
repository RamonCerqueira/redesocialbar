import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (!base || /localhost|127\.0\.0\.1/.test(base)) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/restaurante/pirambeira'],
      disallow: ['/admin', '/moderacao', '/api', '/perfil', '/paquera', '/aqui', '/primeiro-acesso'],
    },
    sitemap: base + '/sitemap.xml',
  };
}
