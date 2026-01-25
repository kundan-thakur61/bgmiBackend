import { Navbar, Footer } from '@/components/layout';
import { createMetadata } from '@/lib/metadata';
import MatchList from '@/components/matches/MatchList';

export const metadata = createMetadata(
  'PUBG Mobile & Free Fire Matches',
  'Join live competitive matches on BattleZone. Play PUBG Mobile matches, Free Fire tournaments, and TDM matches. Enter with minimal fee, win prizes.',
  ['PUBG Mobile matches', 'Free Fire matches', 'competitive gaming', 'tournament entry fee', 'esports matches'],
  'https://battlezone.com/matches',
  '/og-matches.jpg'
);

export default function MatchesPage() {
  return (
    <>
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
          
          <MatchList />
        </div>
      </main>
      
      <Footer />
    </>
  );
}
