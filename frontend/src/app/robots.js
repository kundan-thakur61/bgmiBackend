export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://battlezone.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/admin/',
          '/api/',
          '/private/',
          '/wallet/secret',
          '/profile/settings',
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        crawlDelay: 0.5,
      },
      {
        userAgent: 'Bingbot',
        allow: ['/'],
        crawlDelay: 1,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
