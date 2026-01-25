'use client';

/**
 * Enhanced Schema Components for SEO
 * Includes WebApplication, Article, HowTo, and advanced structured data
 */

export function WebApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'BattleZone',
    applicationCategory: 'GameApplication',
    operatingSystem: 'Android, iOS, Web',
    description: "India's premier esports platform for BGMI, PUBG Mobile, and Free Fire tournaments with real money prizes.",
    url: 'https://battlezone.com',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    softwareVersion: '2.0.0',
    author: {
      '@type': 'Organization',
      name: 'BattleZone',
      url: 'https://battlezone.com',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      description: 'Free to join. Entry fees start from ₹10 per match.',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.6',
      ratingCount: '15000',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'BGMI Tournaments',
      'PUBG Mobile Matches',
      'Free Fire Competitions',
      'Real Money Prizes',
      'Instant Withdrawals',
      'Anti-Cheat System',
      'KYC Verification',
      '24/7 Support',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  );
}

export function ArticleSchema({ article }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || article.description,
    image: article.image || 'https://battlezone.com/og-image.jpg',
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Organization',
      name: article.author || 'BattleZone Team',
      url: 'https://battlezone.com',
      logo: 'https://battlezone.com/logo.png',
    },
    publisher: {
      '@type': 'Organization',
      name: 'BattleZone',
      url: 'https://battlezone.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://battlezone.com/logo.png',
        width: '512',
        height: '512',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
    articleSection: article.category || 'Gaming',
    keywords: article.keywords?.join(', ') || 'BGMI, PUBG Mobile, esports, tournaments',
    wordCount: article.wordCount || 2000,
    inLanguage: 'en-IN',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  );
}

export function HowToSchema({ howTo }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    image: howTo.image || 'https://battlezone.com/og-image.jpg',
    totalTime: howTo.totalTime || 'PT10M',
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'INR',
      value: howTo.cost || '10',
    },
    supply: howTo.supplies || [
      { '@type': 'HowToSupply', name: 'Smartphone with BGMI/PUBG/Free Fire installed' },
      { '@type': 'HowToSupply', name: 'Internet connection' },
      { '@type': 'HowToSupply', name: 'Valid ID for KYC (Aadhaar/PAN)' },
    ],
    tool: howTo.tools || [
      { '@type': 'HowToTool', name: 'BattleZone account' },
      { '@type': 'HowToTool', name: 'UPI payment app' },
    ],
    step: howTo.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
      url: step.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  );
}

export function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://battlezone.com/#business',
    name: 'BattleZone',
    image: 'https://battlezone.com/logo.png',
    description: "India's fastest-growing esports platform for BGMI, PUBG Mobile, and Free Fire tournaments.",
    url: 'https://battlezone.com',
    telephone: '+91-XXXXXXXXXX',
    email: 'support@battlezone.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Dhanbad',
      addressLocality: 'Dhanbad',
      addressRegion: 'Jharkhand',
      postalCode: '826001',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '23.7957',
      longitude: '86.4304',
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    priceRange: '₹10 - ₹1000',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    sameAs: [
      'https://twitter.com/BattleZone',
      'https://facebook.com/BattleZone',
      'https://instagram.com/BattleZone',
      'https://youtube.com/@BattleZone',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  );
}

export function SoftwareApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'BattleZone - BGMI & PUBG Tournament App',
    applicationCategory: 'GameApplication',
    operatingSystem: 'Android 6.0+, iOS 12.0+',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.6',
      ratingCount: '15000',
      bestRating: '5',
      worstRating: '1',
    },
    screenshot: 'https://battlezone.com/app-screenshot.jpg',
    downloadUrl: 'https://battlezone.com/download',
    featureList: 'BGMI Tournaments, PUBG Mobile Matches, Free Fire, Real Money Prizes, Instant Withdrawals',
    releaseNotes: 'Latest version with improved anti-cheat and faster withdrawals',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  );
}

export function VideoObjectSchema({ video }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.uploadDate,
    duration: video.duration,
    contentUrl: video.contentUrl,
    embedUrl: video.embedUrl,
    publisher: {
      '@type': 'Organization',
      name: 'BattleZone',
      logo: {
        '@type': 'ImageObject',
        url: 'https://battlezone.com/logo.png',
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  );
}

export function ReviewSchema({ reviews }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'BattleZone Esports Platform',
    description: 'Play BGMI, PUBG Mobile & Free Fire tournaments for real money',
    brand: {
      '@type': 'Brand',
      name: 'BattleZone',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.6',
      reviewCount: reviews?.length || 500,
      bestRating: '5',
      worstRating: '1',
    },
    review: reviews?.slice(0, 5).map((review) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.author,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: '5',
        worstRating: '1',
      },
      reviewBody: review.text,
      datePublished: review.date,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  );
}
