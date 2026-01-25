import { Navbar, Footer } from '@/components/layout';
import { createMetadata } from '@/lib/metadata';
import TournamentList from '@/components/tournaments/TournamentList';

export const metadata = createMetadata(
  'Esports Tournaments',
  'Participate in exclusive PUBG Mobile and Free Fire tournaments. Solo, duo, squad tournaments with prize pools starting from ₹10,000. Top-rated Indian esports platform.',
  ['esports tournaments', 'PUBG tournaments', 'Free Fire tournaments', 'squad tournaments', 'tournament prizes'],
  'https://battlezone.com/tournaments'
);

export default function TournamentsPage() {
  return (
    <>
      <Navbar />
      
      <main className="min-h-screen pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold font-display mb-2">
              Exclusive Esports Tournaments
            </h1>
            <p className="text-dark-400">
              Join solo, duo, and squad tournaments with real prizes
            </p>
          </div>
          
          <TournamentList />
        </div>
      </main>
      
      <Footer />
    </>
  );
}
