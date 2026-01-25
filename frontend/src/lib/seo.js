export const seoConfig = {
  siteName: 'BattleZone',
  siteUrl: 'https://battlezone.com',
  defaultTitle: 'BattleZone - India\'s #1 BGMI & Free Fire Esports Platform',
  defaultDescription: 'Join India\'s premier esports platform. Play BGMI, Free Fire tournaments, win real cash prizes. 100% secure, instant withdrawals, 24/7 support.',
  keywords: 'BGMI tournaments, Free Fire tournaments, esports India, gaming tournaments, online gaming, cash prizes, PUBG Mobile India, competitive gaming, esports platform',
  twitterHandle: '@battlezone',
  ogImage: '/images/og-image.jpg',
};

export function generateMetadata({ title, description, keywords, image, url, type = 'website' }) {
  const metaTitle = title ? `${title} | ${seoConfig.siteName}` : seoConfig.defaultTitle;
  const metaDescription = description || seoConfig.defaultDescription;
  const metaImage = image || `${seoConfig.siteUrl}${seoConfig.ogImage}`;
  const metaUrl = url ? `${seoConfig.siteUrl}${url}` : seoConfig.siteUrl;
  const metaKeywords = keywords || seoConfig.keywords;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords,
    authors: [{ name: seoConfig.siteName }],
    creator: seoConfig.siteName,
    publisher: seoConfig.siteName,
    formatDetection: { telephone: false },
    metadataBase: new URL(seoConfig.siteUrl),
    alternates: { canonical: metaUrl },
    openGraph: {
      type,
      locale: 'en_IN',
      url: metaUrl,
      title: metaTitle,
      description: metaDescription,
      siteName: seoConfig.siteName,
      images: [{ url: metaImage, width: 1200, height: 630, alt: metaTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [metaImage],
      creator: seoConfig.twitterHandle,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function generateStructuredData(type, data) {
  const schemas = {
    organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: seoConfig.siteName,
      url: seoConfig.siteUrl,
      logo: `${seoConfig.siteUrl}/images/logo.png`,
      sameAs: ['https://twitter.com/battlezone', 'https://facebook.com/battlezone', 'https://instagram.com/battlezone'],
    },
    webSite: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: seoConfig.siteName,
      url: seoConfig.siteUrl,
      potentialAction: { '@type': 'SearchAction', target: `${seoConfig.siteUrl}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
    },
    breadcrumb: (items) => ({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `${seoConfig.siteUrl}${item.url}`,
      })),
    }),
    event: (event) => ({
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: event.title,
      startDate: event.startDate,
      location: { '@type': 'VirtualLocation', url: seoConfig.siteUrl },
      offers: { '@type': 'Offer', price: event.entryFee, priceCurrency: 'INR' },
    }),
  };
  return schemas[type] || (typeof data === 'function' ? schemas[type](data) : null);
}
