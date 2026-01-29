'use client';

import { useState } from 'react';

/**
 * SEO-Optimized FAQ Component with Schema Markup
 * Designed for Featured Snippets, People Also Ask, and Voice Search
 */

// FAQ Schema Component
export function FAQPageSchema({ faqs }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
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

// Single FAQ Item Component
function FAQItem({ question, answer, isOpen, onToggle, index }) {
  return (
    <div 
      className="border-b border-dark-700 last:border-b-0"
      itemScope
      itemProp="mainEntity"
      itemType="https://schema.org/Question"
    >
      <button
        onClick={onToggle}
        className="w-full py-5 px-4 flex items-center justify-between text-left hover:bg-dark-800/50 transition-colors rounded-lg"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
      >
        <h3 
          className="text-lg font-semibold text-white pr-4"
          itemProp="name"
        >
          {question}
        </h3>
        <span 
          className={`text-2xl text-primary-400 transform transition-transform duration-300 flex-shrink-0 ${
            isOpen ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>
      
      <div
        id={`faq-answer-${index}`}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        itemScope
        itemProp="acceptedAnswer"
        itemType="https://schema.org/Answer"
      >
        <div 
          className="px-4 pb-5 text-dark-300 leading-relaxed"
          itemProp="text"
        >
          {answer}
        </div>
      </div>
    </div>
  );
}

// Main FAQ Section Component
export default function FAQ({ 
  faqs, 
  title = 'Frequently Asked Questions',
  subtitle = 'Find answers to common questions about BattleZone',
  showSchema = true,
  className = '',
}) {
  const [openIndex, setOpenIndex] = useState(0);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section 
      className={`py-16 px-4 ${className}`}
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      {showSchema && <FAQPageSchema faqs={faqs} />}
      
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
            {title.includes('FAQ') ? (
              <>
                <span className="gradient-text">FAQ</span> - {title.replace('FAQ', '').replace('-', '').trim() || 'Frequently Asked Questions'}
              </>
            ) : (
              title
            )}
          </h2>
          {subtitle && (
            <p className="text-lg text-dark-400 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* FAQ Items */}
        <div className="bg-dark-800/50 rounded-2xl border border-dark-700 overflow-hidden">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
              index={index}
            />
          ))}
        </div>

        {/* CTA after FAQ */}
        <div className="mt-8 text-center">
          <p className="text-dark-400 mb-4">
            Still have questions? We're here to help.
          </p>
          <a
            href="/tickets"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
          >
            <span>Contact Support</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

// Pre-built FAQ data for different pages
export const homepageFAQs = [
  {
    question: 'How do I join BGMI tournaments on BattleZone?',
    answer: 'To join BGMI tournaments on BattleZone: 1) Create a free account using your mobile number, 2) Complete KYC verification with Aadhaar or PAN card, 3) Add money to your wallet via UPI or bank transfer, 4) Browse available matches and click "Join", 5) Receive room ID and password 15 minutes before the match starts. Entry fees start from just ₹10.',
  },
  {
    question: 'Is BattleZone legal in India?',
    answer: 'Yes, BattleZone is completely legal in India. We operate as a skill-based gaming platform, not gambling. BGMI, PUBG Mobile, and Free Fire are classified as games of skill where player expertise determines the outcome. We require mandatory KYC verification and comply with all applicable Indian gaming regulations.',
  },
  {
    question: 'How fast can I withdraw my winnings from BattleZone?',
    answer: 'Withdrawals on BattleZone are processed within 24-48 hours after your request. You can withdraw via UPI (instant) or direct bank transfer. The minimum withdrawal amount is ₹100. Make sure your KYC verification is complete and your bank details match your KYC documents for smooth processing.',
  },
  {
    question: 'What anti-cheat systems does BattleZone use?',
    answer: 'BattleZone employs a multi-layer anti-cheat system: 1) Screenshot verification with EXIF metadata analysis, 2) Duplicate image detection to prevent reused screenshots, 3) Manual admin review for suspicious activities, 4) Player reporting system, 5) Permanent bans for confirmed cheaters. This ensures fair play for all legitimate players.',
  },
  {
    question: 'What is the minimum entry fee for matches?',
    answer: 'Entry fees on BattleZone start from as low as ₹10 for basic matches. We offer a range of entry fees: ₹10, ₹25, ₹50, ₹100, ₹200, and ₹500 to accommodate players of all budget levels. Higher entry fee matches typically have larger prize pools.',
  },
  {
    question: 'Can I play on both iOS and Android?',
    answer: 'Yes! BattleZone works on both iOS and Android devices. You can access the platform through our web app on any modern browser, or download our dedicated Android app. The games themselves (BGMI, PUBG Mobile, Free Fire) need to be installed separately from their respective app stores.',
  },
  {
    question: 'How do I get the room ID and password for matches?',
    answer: 'Room ID and password are shared 15 minutes before the match starts. You will receive them through: 1) In-app notification, 2) Your dashboard on the match details page, 3) SMS (if enabled). Make sure to join the room on time as matches start punctually.',
  },
  {
    question: 'What games are available on BattleZone?',
    answer: 'BattleZone currently supports three popular mobile games: 1) BGMI (Battlegrounds Mobile India) - All modes including Classic, TDM, Arena, 2) PUBG Mobile - For players in regions where available, 3) Free Fire - Battle royale and Clash Squad modes. We regularly add new games based on player demand.',
  },
];

export const tournamentFAQs = [
  {
    question: 'What is the difference between matches and tournaments?',
    answer: 'Matches are single-game competitions that happen throughout the day with quick results. Tournaments are multi-round competitive events spanning days or weeks with larger prize pools, elimination brackets, and more structured gameplay. Tournaments typically have higher entry fees but offer significantly larger prizes.',
  },
  {
    question: 'How do tournament prize pools work?',
    answer: 'Tournament prize pools are distributed based on final standings. Typically: 1st place receives 40-50% of the pool, 2nd place gets 25-30%, 3rd place receives 15-20%, and remaining positions share the rest. Exact distribution is shown on each tournament page before registration.',
  },
  {
    question: 'Can I participate in multiple tournaments simultaneously?',
    answer: 'Yes, you can register for multiple tournaments as long as their schedules do not overlap. Our system will warn you if you try to join a tournament that conflicts with an existing registration. Plan your tournament schedule carefully to maximize your participation.',
  },
  {
    question: 'What happens if I miss a tournament match?',
    answer: 'If you miss a tournament match without prior notice, you will be marked as a no-show and eliminated from that tournament. Your entry fee is not refunded for no-shows. If you have a genuine emergency, contact support immediately for possible rescheduling options.',
  },
];

export const walletFAQs = [
  {
    question: 'What payment methods are accepted?',
    answer: 'BattleZone accepts multiple payment methods: UPI (Google Pay, PhonePe, Paytm, BHIM), Debit Cards, Credit Cards, Net Banking from all major Indian banks, and popular wallets. All transactions are secured with bank-grade encryption.',
  },
  {
    question: 'Is there a minimum deposit amount?',
    answer: 'The minimum deposit amount is ₹50. There is no maximum limit for deposits. We recommend depositing only what you are comfortable playing with and practicing responsible gaming habits.',
  },
  {
    question: 'Why is my withdrawal delayed?',
    answer: 'Withdrawals may be delayed due to: 1) Incomplete KYC verification, 2) Bank details mismatch with KYC documents, 3) High volume of requests during peak hours, 4) Technical issues with banking partners. If delayed beyond 48 hours, please contact support with your transaction ID.',
  },
];
