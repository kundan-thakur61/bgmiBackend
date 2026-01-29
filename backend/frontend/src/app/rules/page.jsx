import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'Game Rules | BattleZone',
  description: 'Official rules and guidelines for participating in BattleZone BGMI tournaments and matches.',
};

export default function RulesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-dark-900 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Game Rules</h1>

          <div className="space-y-8">
            {/* General Rules */}
            <section className="card p-6">
              <h2 className="text-xl font-bold mb-4 text-primary-400">General Rules</h2>
              <ul className="space-y-3 text-dark-300">
                <li className="flex gap-3">
                  <span className="text-primary-400">1.</span>
                  <span>All participants must be 18 years or older to join paid matches.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400">2.</span>
                  <span>Each player can only use one account. Multiple accounts will result in permanent ban.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400">3.</span>
                  <span>Players must join the room within 5 minutes of room ID release.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400">4.</span>
                  <span>Entry fee is non-refundable once the match starts.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400">5.</span>
                  <span>All decisions made by BattleZone admins are final.</span>
                </li>
              </ul>
            </section>

            {/* Match Rules */}
            <section className="card p-6">
              <h2 className="text-xl font-bold mb-4 text-gaming-green">Match Rules</h2>
              <ul className="space-y-3 text-dark-300">
                <li className="flex gap-3">
                  <span className="text-gaming-green">•</span>
                  <span><strong>Solo Matches:</strong> Each player plays individually. Teaming is strictly prohibited.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gaming-green">•</span>
                  <span><strong>Duo Matches:</strong> Players must play with their registered partner only.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gaming-green">•</span>
                  <span><strong>Squad Matches:</strong> Teams must consist of registered members only.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gaming-green">•</span>
                  <span>Players must use the in-game name registered on BattleZone.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gaming-green">•</span>
                  <span>Screenshot of result must be uploaded within 10 minutes of match completion.</span>
                </li>
              </ul>
            </section>

            {/* Prohibited Actions */}
            <section className="card p-6 border border-red-500/20">
              <h2 className="text-xl font-bold mb-4 text-red-400">Prohibited Actions</h2>
              <p className="text-dark-400 mb-4">The following actions will result in immediate disqualification and potential ban:</p>
              <ul className="space-y-3 text-dark-300">
                <li className="flex gap-3">
                  <span className="text-red-400">❌</span>
                  <span>Using any form of hack, cheat, or exploit</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">❌</span>
                  <span>Teaming with opponents in solo matches</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">❌</span>
                  <span>Using third-party apps that modify gameplay</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">❌</span>
                  <span>Abusing bugs or glitches for unfair advantage</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">❌</span>
                  <span>Toxic behavior, harassment, or hate speech</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">❌</span>
                  <span>Match fixing or result manipulation</span>
                </li>
              </ul>
            </section>

            {/* Prize Distribution */}
            <section className="card p-6">
              <h2 className="text-xl font-bold mb-4 text-gaming-purple">Prize Distribution</h2>
              <ul className="space-y-3 text-dark-300">
                <li className="flex gap-3">
                  <span className="text-gaming-purple">•</span>
                  <span>Prizes are distributed within 10 minutes of result verification.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gaming-purple">•</span>
                  <span>Winner is determined based on survival rank + kills.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gaming-purple">•</span>
                  <span>In case of tie, higher kills wins. If still tied, earlier finish time wins.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gaming-purple">•</span>
                  <span>Per-kill prizes are calculated separately from position prizes.</span>
                </li>
              </ul>
            </section>

            {/* Disputes */}
            <section className="card p-6">
              <h2 className="text-xl font-bold mb-4">Disputes & Appeals</h2>
              <p className="text-dark-300 mb-4">
                If you believe there was an error in result calculation or you want to report a player:
              </p>
              <ol className="space-y-3 text-dark-300 list-decimal list-inside">
                <li>Raise a support ticket within 30 minutes of match completion</li>
                <li>Provide clear screenshots or video evidence</li>
                <li>Our team will review within 24 hours</li>
                <li>Final decision will be communicated via notification</li>
              </ol>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
