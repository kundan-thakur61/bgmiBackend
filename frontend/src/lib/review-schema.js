export const reviewSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'BattleZone Esports Platform',
  description: 'India\'s premier BGMI and Free Fire tournament platform',
  brand: { '@type': 'Brand', name: 'BattleZone' },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '5247',
    bestRating: '5',
    worstRating: '1',
  },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'INR',
    lowPrice: '10',
    highPrice: '500',
    offerCount: '1000',
  },
};

export const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'BattleZone',
  operatingSystem: 'Web, Android, iOS',
  applicationCategory: 'GameApplication',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '5247',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
};
