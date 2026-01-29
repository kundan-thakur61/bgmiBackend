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

export function FAQSchema({ faqs }) {
  // Use provided FAQs or default FAQs
  const defaultFAQs = [
    {
      question: 'How do I join a match on BattleZone?',
      answer: "Sign up for an account, complete KYC verification, add money to your wallet, browse available matches, and click join. You'll receive room details before the match starts.",
    },
    {
      question: 'What games are available on BattleZone?',
      answer: 'BattleZone offers PUBG Mobile and Free Fire matches including solo matches, duo matches, squad matches, and special tournament formats with real money prizes.',
    },
    {
      question: 'How are match results verified?',
      answer: 'Players upload match screenshots after completion. Our anti-cheat system verifies using EXIF data analysis, duplicate image detection, and manual admin review to prevent fraud.',
    },
    {
      question: 'When can I withdraw my winnings?',
      answer: 'After KYC verification is complete and you meet the minimum withdrawal amount, withdrawals are processed within 24-48 hours via UPI or bank transfer.',
    },
    {
      question: 'Is BattleZone legal in India?',
      answer: 'Yes, BattleZone operates as a skill-based gaming platform, not gambling. All games are competitive and skill-based, compliant with Indian gaming regulations.',
    },
  ];

  const faqList = faqs || defaultFAQs;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqList.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
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
  if (!match) return null;
  
  const slotsLeft = match.maxSlots - (match.filledSlots || match.joinedUsers?.length || 0);
  const matchId = match._id || match.id;
  const startTime = match.scheduledAt || match.startTime;
  const endTime = match.endTime || (startTime ? new Date(new Date(startTime).getTime() + 30 * 60000).toISOString() : null);
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: match.title || `${match.gameType} ${match.matchType} - Prize ₹${match.prizePool}`,
    description: `Join this competitive ${match.gameType || 'BGMI'} ${match.matchType || 'match'} match. Entry fee: ₹${match.entryFee || 0}. Prize pool: ₹${match.prizePool || 0}. ${match.mode || 'Squad'} mode. Max slots: ${match.maxSlots || 100}`,
    startDate: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
    ...(endTime && { endDate: new Date(endTime).toISOString() }),
    eventStatus: match.status === 'live' ? 'https://schema.org/EventScheduled' : 
                 match.status === 'completed' ? 'https://schema.org/EventPostponed' :
                 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: 'https://battlezone.com',
    },
    offers: {
      '@type': 'Offer',
      price: match.entryFee || 0,
      priceCurrency: 'INR',
      availability: slotsLeft > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://battlezone.com/matches/${matchId}`,
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
  if (!tournament) return null;
  
  const tournamentId = tournament._id || tournament.id;
  const tournamentName = tournament.title || tournament.name;
  const slotsLeft = tournament.maxTeams - (tournament.registeredTeams || 0);
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: tournamentName,
    description: tournament.description || `Join ${tournamentName} tournament on BattleZone. Prize pool: ₹${tournament.prizePool || 0}. Entry fee: ₹${tournament.entryFee || 0}.`,
    startDate: tournament.startAt || tournament.startDate ? new Date(tournament.startAt || tournament.startDate).toISOString() : new Date().toISOString(),
    endDate: tournament.endAt || tournament.endDate ? new Date(tournament.endAt || tournament.endDate).toISOString() : null,
    eventStatus: tournament.status === 'ongoing' ? 'https://schema.org/EventScheduled' :
                 tournament.status === 'completed' ? 'https://schema.org/EventPostponed' :
                 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: 'https://battlezone.com',
    },
    offers: {
      '@type': 'Offer',
      price: tournament.entryFee || 0,
      priceCurrency: 'INR',
      availability: slotsLeft > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://battlezone.com/tournaments/${tournamentId}`,
    },
    organizer: {
      '@type': 'Organization',
      name: 'BattleZone',
      url: 'https://battlezone.com',
    },
  };

  // Remove endDate if null
  if (!schema.endDate) {
    delete schema.endDate;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  );
}
