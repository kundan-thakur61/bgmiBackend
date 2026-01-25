export const SITE_CONFIG = {
  name: 'BattleZone',
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://battlezone.com',
  description: 'Play BGMI, PUBG Mobile & Free Fire tournaments for real money. Join 50,000+ players. Entry from ₹10. Instant withdrawals.',
  author: 'BattleZone',
  twitterHandle: '@BattleZone',
  ogImage: '/og-image.jpg',
  phone: '+91-XXXXXXXXXX',
  email: 'support@battlezone.com',
  location: {
    city: 'Dhanbad',
    state: 'Jharkhand',
    country: 'India',
  },
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
  'Play BGMI & PUBG Tournaments for Real Money',
  "Join 50,000+ players on India's #1 esports platform. Compete in BGMI, PUBG Mobile & Free Fire tournaments. ₹10 entry fee, instant withdrawals. Play now! 🎮",
  [
    'BGMI tournament app',
    'PUBG Mobile tournaments India',
    'esports platform India',
    'real money gaming',
    'competitive gaming platform',
    'skill-based games India',
    'Free Fire tournaments',
    'win real money playing PUBG',
    'mobile esports',
    'Indian esports',
  ]
);

// Page-specific metadata generators
export const pageMetadata = {
  matches: createMetadata(
    'Live BGMI & PUBG Mobile Matches',
    'Browse 1000+ daily matches. Entry fees from ₹10. Fair play verified. Win real cash & withdraw in 24 hours. Find your next match →',
    ['BGMI matches', 'PUBG Mobile matches live', 'esports matches', 'real money matches', 'competitive gaming'],
    'https://battlezone.com/matches',
    '/og-matches.jpg'
  ),
  
  tournaments: createMetadata(
    'BGMI & Free Fire Tournaments India | ₹50,000+ Daily Prizes',
    'Weekly tournaments with massive prize pools. Solo, Duo & Squad formats. Register free, compete against India\'s best players. See today\'s tournaments →',
    ['BGMI tournaments', 'Free Fire tournaments', 'esports tournaments India', 'gaming tournaments', 'squad tournaments'],
    'https://battlezone.com/tournaments',
    '/og-tournaments.jpg'
  ),
  
  howItWorks: createMetadata(
    'How to Join BGMI Tournaments & Win Real Money',
    'Learn how BattleZone works. Simple steps: Sign up, add money, join matches, play, win prizes. Complete guide with screenshots & tips.',
    ['how to play BGMI tournaments', 'tournament guide', 'esports getting started', 'BattleZone tutorial'],
    'https://battlezone.com/how-it-works'
  ),
  
  wallet: createMetadata(
    'Wallet - Add Money & Withdraw Winnings',
    'Secure wallet for tournament payments. Add via UPI, Paytm, bank transfer. Withdraw winnings in 24-48 hours. Track all transactions.',
    ['gaming wallet', 'esports wallet', 'withdraw gaming winnings', 'add money for gaming'],
    'https://battlezone.com/wallet'
  ),
  
  blog: createMetadata(
    'Gaming Blog - BGMI Tips, Strategies & Esports News',
    'Expert BGMI & PUBG Mobile tips, tournament strategies, pro player guides, and latest esports news. Level up your game!',
    ['BGMI tips', 'PUBG Mobile guide', 'esports news India', 'gaming strategies', 'Free Fire tips'],
    'https://battlezone.com/blog'
  ),
  
  fairPlay: createMetadata(
    'Fair Play Policy - Anti-Cheat & Fraud Prevention',
    'Learn about BattleZone\'s advanced anti-cheat systems. Screenshot verification, EXIF analysis, and manual review ensure fair tournaments.',
    ['anti-cheat gaming', 'fair play esports', 'fraud prevention gaming', 'cheat detection'],
    'https://battlezone.com/fair-play'
  ),
  
  rules: createMetadata(
    'Tournament Rules & Guidelines',
    'Official BattleZone tournament rules. Match formats, scoring system, prize distribution, and player conduct guidelines.',
    ['tournament rules', 'esports rules', 'gaming competition rules', 'BGMI tournament rules'],
    'https://battlezone.com/rules'
  ),
  
  kyc: createMetadata(
    'KYC Verification - Secure Your Account',
    'Complete KYC verification to enable withdrawals. Simple process using Aadhaar or PAN card. Secure and confidential.',
    ['KYC gaming', 'identity verification gaming', 'secure gaming account'],
    'https://battlezone.com/kyc'
  ),
};
