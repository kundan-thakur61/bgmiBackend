import { Navbar, Footer } from '@/components/layout';
import { pageMetadata } from '@/lib/metadata';
import { FAQSchema } from '@/components/seo';
import TournamentList from '@/components/tournaments/TournamentList';

export const metadata = pageMetadata.tournaments;

// FAQ data for tournaments page
const tournamentFAQs = [
  {
    question: 'What is the difference between matches and tournaments?',
    answer: 'Matches are single-game competitions with quick results. Tournaments are multi-round events spanning days with larger prize pools, elimination brackets, and more structured gameplay.',
  },
  {
    question: 'How do tournament prize pools work?',
    answer: 'Prize pools are distributed based on final standings. Typically: 1st place gets 40-50%, 2nd place gets 25-30%, 3rd place gets 15-20%. Exact distribution is shown on each tournament page.',
  },
  {
    question: 'Can I participate in multiple tournaments?',
    answer: 'Yes, you can register for multiple tournaments as long as their schedules do not overlap. The system will warn you if there are conflicts.',
  },
  {
    question: 'What happens if I miss a tournament match?',
    answer: 'No-shows result in elimination from the tournament without refund. Contact support immediately if you have a genuine emergency for possible rescheduling.',
  },
];

export default function TournamentsPage() {
  return (
    <>
      <FAQSchema faqs={tournamentFAQs} />
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
