import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata(
  'Premium Esports Gaming Platform',
  "Join BattleZone - India's fastest-growing esports platform for PUBG Mobile and Free Fire tournaments. Play, win, and withdraw real money instantly.",
  ['esports platform', 'competitive gaming', 'real money tournaments', 'PUBG Mobile', 'Free Fire'],
  'https://battlezone.com',
  '/og-hero.jpg'
);

export default function HomePage() {
  const features = [
    {
      icon: '🎮',
      title: 'Multiple Game Modes',
      description: 'Solo, Duo, Squad matches and tournaments for PUBG Mobile & Free Fire',
    },
    {
      icon: '💰',
      title: 'Real Money Prizes',
      description: 'Win real cash prizes and withdraw instantly to your bank account',
    },
    {
      icon: '🛡️',
      title: 'Fair Play Guaranteed',
      description: 'Advanced anti-cheat system and manual verification for fair results',
    },
    {
      icon: '⚡',
      title: 'Instant Withdrawals',
      description: '24-48 hour withdrawal processing via UPI or bank transfer',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Active Players' },
    { value: '₹10L+', label: 'Monthly Prizes' },
    { value: '1000+', label: 'Daily Matches' },
    { value: '99.9%', label: 'Uptime' },
  ];

  const games = [
    { name: 'PUBG Mobile', icon: '🎯', description: 'Classic, TDM, and Arena matches' },
    { name: 'Free Fire', icon: '🔥', description: 'Battle royale and clash squad' },
    { name: 'BGMI', icon: '🎮', description: 'All modes supported' },
  ];

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-900/20 via-dark-900 to-dark-900" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary-500/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-dark-800/80 backdrop-blur rounded-full border border-dark-700 mb-8">
              <span className="text-gaming-green mr-2">●</span>
              <span className="text-sm text-dark-200">Live matches available now</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-display mb-6">
              Play Competitive
              <span className="block gradient-text">Esports Matches</span>
              <span className="block">for Real Money</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-dark-300 max-w-2xl mx-auto mb-10">
              Join BattleZone, India&apos;s fastest-growing esports platform for 
              PUBG Mobile and Free Fire tournaments. Compete, win, and withdraw instantly.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="btn-primary btn-lg px-8 animate-pulse-glow">
                Start Playing Now
              </Link>
              <Link href="/how-it-works" className="btn-outline btn-lg px-8">
                How It Works
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold gradient-text mb-1">{stat.value}</div>
                  <div className="text-sm text-dark-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Games Section */}
        <section className="py-20 px-4 bg-dark-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
                Supported Games
              </h2>
              <p className="text-dark-400 max-w-xl mx-auto">
                Compete in your favorite mobile esports games with players across India
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {games.map((game) => (
                <div key={game.name} className="card-hover p-6 text-center">
                  <div className="text-5xl mb-4">{game.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{game.name}</h3>
                  <p className="text-dark-400 text-sm">{game.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
                Why Choose BattleZone?
              </h2>
              <p className="text-dark-400 max-w-xl mx-auto">
                The most trusted and feature-rich esports platform in India
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="card p-6">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-dark-400 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-primary-900/50 to-gaming-purple/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
              Ready to Start Winning?
            </h2>
            <p className="text-dark-300 mb-8">
              Join thousands of players competing daily for real prizes
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="btn-primary btn-lg px-8">
                Create Free Account
              </Link>
              <Link href="/matches" className="btn-outline btn-lg px-8">
                Browse Matches
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Brief */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
                How It Works
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Sign Up', desc: 'Create your free account in seconds' },
                { step: '2', title: 'Add Funds', desc: 'Deposit money securely via UPI/Cards' },
                { step: '3', title: 'Join Match', desc: 'Pick a match and receive room details' },
                { step: '4', title: 'Win & Withdraw', desc: 'Win prizes and withdraw anytime' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary-400 font-bold text-xl">{item.step}</span>
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-dark-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}
