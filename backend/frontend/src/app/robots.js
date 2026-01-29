import { seoConfig } from '@/lib/seo';

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/', '/private/', '/wallet/secret', '/profile/settings'], crawlDelay: 1 },
      { userAgent: 'Googlebot', allow: '/', crawlDelay: 0.5 },
      { userAgent: 'Bingbot', allow: '/', crawlDelay: 1 },
    ],
    sitemap: `${seoConfig.siteUrl}/sitemap.xml`,
  };
}
