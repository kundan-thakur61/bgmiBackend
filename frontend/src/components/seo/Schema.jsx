'use client';

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BattleZone',
    url: 'https://battlezone.com',
    logo: 'https://battlezone.com/logo.png',
    description: "India's premier esports gaming platform for PUBG Mobile and Free Fire tournaments.",
    foundingDate: '2024',
    foundingLocation: {
      '@type': 'Place',
      name: 'Dhanbad, Jharkhand, India',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressLocality: 'Dhanbad',
      addressRegion: 'JH',
    },
    contact: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@battlezone.com',
      url: 'https://battlezone.com/contact',
    },
    sameAs: [
      'https://twitter.com/BattleZone',
      'https://facebook.com/BattleZone',
      'https://instagram.com/BattleZone',
      'https://youtube.com/@BattleZone',
      'https://discord.gg/BattleZone',
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

export function FAQSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I join a match on BattleZone?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Sign up for an account, complete KYC verification, add money to your wallet, browse available matches, and click join. You'll receive room details before the match starts.",
        },
      },
      {
        '@type': 'Question',
        name: 'What games are available on BattleZone?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'BattleZone offers PUBG Mobile and Free Fire matches including solo matches, duo matches, squad matches, and special tournament formats with real money prizes.',
        },
      },
      {
        '@type': 'Question',
        name: 'How are match results verified?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Players upload match screenshots after completion. Our anti-cheat system verifies using EXIF data analysis, duplicate image detection, and manual admin review to prevent fraud.',
        },
      },
      {
        '@type': 'Question',
        name: 'When can I withdraw my winnings?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'After KYC verification is complete and you meet the minimum withdrawal amount, withdrawals are processed within 24-48 hours via UPI or bank transfer.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is BattleZone legal in India?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, BattleZone operates as a skill-based gaming platform, not gambling. All games are competitive and skill-based, compliant with Indian gaming regulations.',
        },
      },
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

export function BreadcrumbSchema({ items }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
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

export function MatchSchema({ match }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${match.gameType} ${match.matchType} - Prize ₹${match.prize}`,
    description: `Join this competitive ${match.gameType} ${match.matchType} match. Entry fee: ₹${match.entryFee}. Prize: ₹${match.prize}. Max slots: ${match.maxSlots}`,
    startDate: new Date(match.startTime).toISOString(),
    endDate: new Date(match.endTime).toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: 'https://battlezone.com',
    },
    offers: {
      '@type': 'Offer',
      price: match.entryFee,
      priceCurrency: 'INR',
      availability: match.remainingSlots > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://battlezone.com/matches/${match.id}`,
    },
    organizer: {
      '@type': 'Organization',
      name: 'BattleZone',
      url: 'https://battlezone.com',
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

export function TournamentSchema({ tournament }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: tournament.name,
    description: tournament.description || `Join ${tournament.name} tournament on BattleZone`,
    startDate: new Date(tournament.startDate).toISOString(),
    endDate: new Date(tournament.endDate).toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: 'https://battlezone.com',
    },
    offers: {
      '@type': 'Offer',
      price: tournament.entryFee,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `https://battlezone.com/tournaments/${tournament.id}`,
    },
    organizer: {
      '@type': 'Organization',
      name: 'BattleZone',
      url: 'https://battlezone.com',
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
