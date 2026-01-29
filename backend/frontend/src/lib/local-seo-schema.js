export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'BattleZone',
  description: 'India\'s premier esports platform for BGMI and Free Fire tournaments',
  url: 'https://battlezone.com',
  telephone: '+91-XXXXXXXXXX',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'IN',
    addressRegion: 'India',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 28.6139,
    longitude: 77.2090,
  },
  areaServed: {
    '@type': 'Country',
    name: 'India',
  },
  priceRange: '₹10 - ₹500',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '5000',
  },
};

export const videoGameSchema = {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'BattleZone Esports Platform',
  gamePlatform: ['Android', 'iOS'],
  genre: ['Esports', 'Battle Royale', 'Competitive Gaming'],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '5000',
  },
};
