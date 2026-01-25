export const SITE_CONFIG = {
  name: 'BattleZone',
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://battlezone.com',
  description: 'Play PUBG Mobile & Free Fire tournaments for real money',
  author: 'BattleZone',
  twitterHandle: '@BattleZone',
  ogImage: '/og-image.jpg',
};

export const createMetadata = (
  title,
  description,
  keywords = [],
  canonicalUrl,
  ogImage,
  ogType = 'website'
) => {
  const fullTitle = `${title} | ${SITE_CONFIG.name}`;
  const imageUrl = ogImage || SITE_CONFIG.ogImage;
  const canonical = canonicalUrl || SITE_CONFIG.baseUrl;

  return {
    metadataBase: new URL(SITE_CONFIG.baseUrl),
    title: fullTitle,
    description,
    keywords: [
      'BattleZone',
      'esports',
      'PUBG Mobile',
      'Free Fire',
      'competitive gaming',
      'real money gaming',
      'esports tournaments',
      'India esports',
      ...keywords,
    ],
    authors: [{ name: SITE_CONFIG.author }],
    creator: SITE_CONFIG.author,
    publisher: SITE_CONFIG.author,
    openGraph: {
      type: ogType,
      locale: 'en_IN',
      url: canonical,
      siteName: SITE_CONFIG.name,
      title: fullTitle,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitterHandle,
      creator: SITE_CONFIG.twitterHandle,
      title: fullTitle,
      description,
      images: [imageUrl],
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
    alternates: {
      canonical: canonical,
    },
    icons: {
      icon: '/favicon.ico',
    },
    manifest: '/site.webmanifest',
  };
};

export const defaultMetadata = createMetadata(
  'Premium Esports Gaming Platform',
  "Join BattleZone - India's fastest-growing esports platform for PUBG Mobile and Free Fire tournaments. Play, win, and withdraw real money instantly.",
  [
    'esports platform',
    'competitive gaming',
    'real money tournaments',
    'skill-based games',
    'Indian esports',
  ]
);
