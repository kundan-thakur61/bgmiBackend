import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'Fair Play Policy | BattleZone',
  description: 'BattleZone fair play policy - ensuring a fair and competitive gaming environment for all players.',
};

export default function FairPlayPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-dark-900 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Fair Play Policy</h1>
          <p className="text-dark-400 mb-8">
            At BattleZone, we are committed to maintaining a fair, competitive, and enjoyable gaming environment for all players.
          </p>

          <div className="space-y-8">
            {/* Our Commitment */}
            <section className="card p-6">
              <h2 className="text-xl font-bold mb-4 text-primary-400">🛡️ Our Commitment</h2>
              <p className="text-dark-300 mb-4">
                We invest heavily in anti-cheat technology and manual monitoring to ensure every match is fair. Our dedicated team reviews suspicious activity 24/7.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-dark-700/50 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">🔍</div>
                  <div className="font-medium">Active Monitoring</div>
                  <div className="text-dark-400 text-sm">Real-time detection</div>
                </div>
                <div className="bg-dark-700/50 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">🤖</div>
                  <div className="font-medium">AI Detection</div>
                  <div className="text-dark-400 text-sm">Pattern analysis</div>
                </div>
                <div className="bg-dark-700/50 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">👥</div>
                  <div className="font-medium">Manual Review</div>
                  <div className="text-dark-400 text-sm">Expert verification</div>
                </div>
              </div>
            </section>

            {/* What We Consider Cheating */}
            <section className="card p-6 border border-red-500/20">
              <h2 className="text-xl font-bold mb-4 text-red-400">🚫 What We Consider Cheating</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Software Cheats</h3>
                  <ul className="space-y-2 text-dark-300 text-sm">
                    <li>• Aimbots and aim assistance</li>
                    <li>• Wallhacks and ESP</li>
                    <li>• Speed hacks</li>
                    <li>• Recoil scripts</li>
                    <li>• Auto-fire modifications</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Unfair Practices</h3>
                  <ul className="space-y-2 text-dark-300 text-sm">
                    <li>• Teaming in solo matches</li>
                    <li>• Exploiting game bugs</li>
                    <li>• Using multiple accounts</li>
                    <li>• Match fixing</li>
                    <li>• Account sharing</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Consequences */}
            <section className="card p-6">
              <h2 className="text-xl font-bold mb-4 text-yellow-400">⚠️ Consequences</h2>
              <p className="text-dark-300 mb-4">
                We take cheating very seriously. Depending on the severity, cheaters may face:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-4 bg-dark-700/50 rounded-lg p-4">
                  <div className="text-2xl">1️⃣</div>
                  <div>
                    <div className="font-medium">First Offense</div>
                    <div className="text-dark-400 text-sm">7-day ban + forfeiture of winnings</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-dark-700/50 rounded-lg p-4">
                  <div className="text-2xl">2️⃣</div>
                  <div>
                    <div className="font-medium">Second Offense</div>
                    <div className="text-dark-400 text-sm">30-day ban + wallet freeze</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                  <div className="text-2xl">3️⃣</div>
                  <div>
                    <div className="font-medium text-red-400">Third Offense</div>
                    <div className="text-dark-400 text-sm">Permanent ban + legal action if applicable</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Report a Player */}
            <section className="card p-6 border border-primary-500/20 bg-primary-500/5">
              <h2 className="text-xl font-bold mb-4 text-primary-400">📢 Report a Player</h2>
              <p className="text-dark-300 mb-4">
                If you suspect someone is cheating, help us maintain fair play by reporting them:
              </p>
              <ol className="space-y-3 text-dark-300">
                <li className="flex gap-3">
                  <span className="bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                  <span>Go to Support Tickets</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                  <span>Select "Report User" category</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                  <span>Provide player's username and match ID</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
                  <span>Attach video/screenshot evidence if available</span>
                </li>
              </ol>
              <p className="text-dark-500 text-sm mt-4">
                All reports are reviewed within 24 hours. You will be notified of the outcome.
              </p>
            </section>

            {/* Appeals */}
            <section className="card p-6">
              <h2 className="text-xl font-bold mb-4">📝 Appeals Process</h2>
              <p className="text-dark-300 mb-4">
                If you believe you were wrongly banned, you can appeal:
              </p>
              <ul className="space-y-2 text-dark-300">
                <li>• Submit an appeal ticket within 7 days of the ban</li>
                <li>• Provide any evidence supporting your case</li>
                <li>• Appeals are reviewed by a senior admin</li>
                <li>• Decision is final and will be communicated within 48 hours</li>
              </ul>
            </section>

            {/* Community Standards */}
            <section className="card p-6">
              <h2 className="text-xl font-bold mb-4 text-gaming-green">🤝 Community Standards</h2>
              <p className="text-dark-300 mb-4">
                Beyond cheating, we expect all players to:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-gaming-green">✓</span>
                  <span className="text-dark-300">Treat others with respect</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gaming-green">✓</span>
                  <span className="text-dark-300">No harassment or hate speech</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gaming-green">✓</span>
                  <span className="text-dark-300">Play honestly and fairly</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gaming-green">✓</span>
                  <span className="text-dark-300">Report bugs instead of exploiting</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
