import { Suspense } from 'react';
import { Navbar, Footer } from '@/components/layout';
import { pageMetadata } from '@/lib/metadata';
import { FAQSchema } from '@/components/seo';
import MatchList from '@/components/matches/MatchList';

export const dynamic = 'force-dynamic';
export const metadata = pageMetadata.matches;

// FAQ data for matches page
const matchesFAQs = [
  {
    question: 'How do I join a match on BattleZone?',
    answer: 'Browse available matches, select one that fits your budget and game mode preference, click Join, and pay the entry fee. Room ID and password are shared 15 minutes before the match starts.',
  },
  {
    question: 'What is the minimum entry fee for matches?',
    answer: 'Entry fees start from just ₹10 for basic matches. We offer various entry levels: ₹10, ₹25, ₹50, ₹100, ₹200, and ₹500 to suit all budgets.',
  },
  {
    question: 'When do I receive the room ID and password?',
    answer: 'Room credentials are shared 15 minutes before the match start time via in-app notification and on your dashboard. Make sure to join on time.',
  },
  {
    question: 'How are match results verified?',
    answer: 'After the match, upload your result screenshot. Our system verifies using EXIF data analysis and duplicate detection. Admin review ensures fair play.',
  },
];

export default function MatchesPage() {
  return (
    <>
      <FAQSchema faqs={matchesFAQs} />
      <Navbar />

      <main className="min-h-screen pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold font-display mb-2">
              Competitive PUBG Mobile & Free Fire Matches
            </h1>
            <p className="text-dark-400">
              Browse and join our latest matches with real prizes
            </p>
          </div>

          <Suspense fallback={<div className="text-center py-12">Loading matches...</div>}>
            <MatchList />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  );
}
