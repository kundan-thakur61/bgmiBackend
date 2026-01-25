'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import FAQ, { homepageFAQs } from '@/components/ui/FAQ';
import { getMatches } from '@/lib/api';
import { faqSchema } from '@/lib/faq-schema';
// Import external CSS for performance (enables browser caching)
import '@/styles/hero-styles.css';

export default function HomePage() {
  const [challenges, setChallenges] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Generate fixed particle positions (avoid hydration mismatch)
  // Performance: reduced particles for better mobile performance
  const particlePositions = useMemo(() => {
    // Check device capabilities and adjust particle count
    const particleCount = typeof window !== 'undefined' ?
      (window.innerWidth < 768 ||
        (navigator.deviceMemory && navigator.deviceMemory < 4) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? 6 : 12 : 12;

    return Array.from({ length: particleCount }, (_, i) => ({
      left: ((i * 17 + 13) % 100), // Deterministic positions
      delay: ((i * 3 + 7) % 10),
      duration: 10 + ((i * 2) % 4) // Slower animations = less CPU
    }));
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchChallenges();

    // Performance monitoring
    const handlePerformance = () => {
      if (typeof window !== 'undefined') {
        // Check memory usage if available
        if (window.performance?.memory &&
          window.performance.memory.usedJSHeapSize > 500 * 1024 * 1024) {
          document.body.classList.add('performance-mode');
        }

        // Check for reduced motion preference changes
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handleMotionChange = (e) => {
          if (e.matches) {
            document.body.classList.add('reduce-motion');
          } else {
            document.body.classList.remove('reduce-motion');
          }
        };

        motionQuery.addEventListener('change', handleMotionChange);

        return () => {
          motionQuery.removeEventListener('change', handleMotionChange);
        };
      }
    };

    return handlePerformance();
  }, []);

  const fetchChallenges = async () => {
    try {
      const data = await getMatches({ isChallenge: 'true', status: 'upcoming,registration_open', limit: 6 });
      setChallenges(data.matches || []);
    } catch (err) {
      console.error('Failed to fetch challenges:', err);
    } finally {
      setLoadingChallenges(false);
    }
  };

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'BattleZone',
          url: 'https://battlezone.com',
          potentialAction: { '@type': 'SearchAction', target: 'https://battlezone.com/search?q={search_term_string}', 'query-input': 'required name=search_term_string' },
        })
      }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 body-text">
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 px-4 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 cyber-grid opacity-30" />
          <div className="scanline" />

          {/* Particle Effects */}
          <div className="particle-bg">
            {mounted && particlePositions.map((pos, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${pos.left}%`,
                  animationDelay: `${pos.delay}s`,
                  animationDuration: `${pos.duration}s`
                }}
              />
            ))}
          </div>

          {/* Gradient Orbs */}
          <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-40 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative max-w-7xl mx-auto text-center">
            {/* Live Indicator Badge */}
            <div className="inline-flex items-center px-6 py-3 bg-black/60 backdrop-blur-xl rounded-full border border-cyan-500/30 mb-10 holographic">
              <span className="w-3 h-3 bg-cyan-400 rounded-full mr-3 live-indicator" style={{ boxShadow: '0 0 10px #00ffff' }} />
              <span className="text-sm font-semibold text-cyan-300 tracking-wider uppercase">Live Matches Available Now</span>
            </div>

            {/* Main Heading */}
            <h1 className="hero-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-8">
              <span className="block mb-2 text-white" style={{
                animation: 'fadeInUp 0.8s ease-out',
                textShadow: '0 0 30px rgba(255,255,255,0.5)'
              }}>
                PLAY COMPETITIVE
              </span>
              <span className="block neon-text mb-2" style={{ animationDelay: '0.2s' }}>
                ESPORTS MATCHES
              </span>
              <span className="block text-white" style={{
                animation: 'fadeInUp 0.8s ease-out 0.4s backwards',
                backgroundImage: 'linear-gradient(135deg, #fff, #00ffff, #ff00ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                FOR REAL MONEY
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 font-light leading-relaxed" style={{
              animation: 'fadeInUp 0.8s ease-out 0.6s backwards'
            }}>
              Join <span className="text-cyan-400 font-semibold">BattleZone</span>, India&apos;s fastest-growing esports platform for
              PUBG Mobile and Free Fire tournaments. <span className="text-purple-400">Compete, win, and withdraw instantly.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20" style={{
              animation: 'fadeInUp 0.8s ease-out 0.8s backwards'
            }}>
              <Link
                href="/register"
                className="cta-button px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-lg font-bold shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105"
                style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.4)' }}
              >
                Start Playing Now
              </Link>
              <Link
                href="/how-it-works"
                className="cta-button px-10 py-5 bg-transparent border-2 border-cyan-400 text-cyan-400 rounded-lg text-lg font-bold hover:bg-cyan-400/10 transition-all duration-300 hover:scale-105"
              >
                How It Works
              </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="stat-glow"
                  style={{
                    animation: `fadeInUp 0.8s ease-out ${1 + index * 0.1}s backwards`
                  }}
                >
                  <div className="text-5xl sm:text-6xl font-black hero-title neon-text mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm sm:text-base text-gray-400 uppercase tracking-widest font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live Challenges Section */}
        <section className="py-20 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 via-purple-900/10 to-transparent" />

          <div className="relative max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gaming-purple/20 to-gaming-orange/20 rounded-full border border-gaming-purple/30 mb-4">
                  <span className="w-2 h-2 bg-gaming-orange rounded-full mr-2 live-indicator" />
                  <span className="text-sm font-semibold text-gaming-orange uppercase tracking-wider">Live Challenges</span>
                </div>
                <h2 className="hero-title text-3xl sm:text-4xl md:text-5xl">
                  <span className="text-white">PLAYER VS PLAYER </span>
                  <span className="neon-text">CHALLENGES</span>
                </h2>
                <p className="text-gray-400 mt-3 max-w-xl">
                  Accept a challenge, defeat your opponent, and win the entire prize pool!
                </p>
              </div>
              <Link
                href="/matches?isChallenge=true"
                className="hidden sm:flex items-center text-cyan-400 hover:text-cyan-300 transition-colors font-semibold"
              >
                View All Challenges
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {loadingChallenges ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-800 animate-pulse">
                    <div className="h-6 bg-gray-700 rounded w-3/4 mb-4" />
                    <div className="h-4 bg-gray-700 rounded w-1/2 mb-3" />
                    <div className="h-4 bg-gray-700 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : challenges.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {challenges.map((challenge, index) => (
                  <Link
                    key={challenge._id}
                    href={`/matches/${challenge._id}`}
                    className="group relative"
                    style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.1}s backwards` }}
                  >
                    <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 hover:border-cyan-400/50 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/20">
                      {/* Challenge Badge */}
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-gaming-purple to-gaming-orange text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl">
                        🎯 CHALLENGE
                      </div>

                      {/* Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">
                          {challenge.gameType === 'pubg_mobile' ? '🎯' : challenge.gameType === 'free_fire' ? '🔥' : '🎮'}
                        </span>
                        <div>
                          <h3 className="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                            {challenge.title}
                          </h3>
                          <p className="text-sm text-gray-400 capitalize">{challenge.gameType?.replace('_', ' ')}</p>
                        </div>
                      </div>

                      {/* Prize & Entry */}
                      <div className="flex justify-between items-center mb-4 p-3 bg-black/30 rounded-xl">
                        <div className="text-center">
                          <p className="text-xs text-gray-400 uppercase">Prize Pool</p>
                          <p className="text-xl font-bold text-gaming-green">₹{challenge.prizePool}</p>
                        </div>
                        <div className="w-px h-10 bg-gray-700" />
                        <div className="text-center">
                          <p className="text-xs text-gray-400 uppercase">Entry Fee</p>
                          <p className="text-xl font-bold text-gaming-orange">₹{challenge.entryFee}</p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex justify-between text-sm text-gray-400 mb-4">
                        <span className="capitalize">{challenge.matchType} • {challenge.mode}</span>
                        <span>{challenge.filledSlots || challenge.joinedUsers?.length || 0}/{challenge.maxSlots} joined</span>
                      </div>

                      {/* CTA */}
                      <div className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-500/20 group-hover:border-cyan-400/50 transition-colors">
                        <span className="text-cyan-400 font-semibold">Accept Challenge</span>
                        <svg className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-800">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-white mb-2">No Active Challenges</h3>
                <p className="text-gray-400 mb-6">Be the first to create a challenge and find opponents!</p>
                <Link
                  href="/create-match"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gaming-purple to-gaming-orange text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                >
                  Create a Challenge
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Link>
              </div>
            )}

            {/* Mobile View All Link */}
            <Link
              href="/matches?isChallenge=true"
              className="sm:hidden flex items-center justify-center text-cyan-400 hover:text-cyan-300 transition-colors font-semibold mt-8"
            >
              View All Challenges
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Games Section */}
        <section className="py-24 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent" />

          <div className="relative max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="hero-title text-4xl sm:text-5xl md:text-6xl mb-6">
                <span className="text-white">SUPPORTED </span>
                <span className="neon-text">GAMES</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
                Compete in your favorite mobile esports games with players across India
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {games.map((game, index) => (
                <div
                  key={game.name}
                  className="game-card p-8 rounded-2xl text-center bg-gray-900/50"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.15}s backwards`
                  }}
                >
                  <div className="text-7xl mb-6 transform hover:scale-110 transition-transform duration-300">
                    {game.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white hero-title">
                    {game.name}
                  </h3>
                  <p className="text-gray-400 font-light">
                    {game.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-4 relative">
          <div className="absolute inset-0 cyber-grid opacity-10" />

          <div className="relative max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="hero-title text-4xl sm:text-5xl md:text-6xl mb-6">
                <span className="text-white">WHY CHOOSE </span>
                <span className="neon-text">BATTLEZONE?</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
                The most trusted and feature-rich esports platform in India
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="feature-card p-8 rounded-2xl"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s backwards`
                  }}
                >
                  <div className="text-6xl mb-6 transform hover:rotate-12 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-cyan-400 tracking-wide">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed font-light">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 holographic" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />

          <div className="relative max-w-4xl mx-auto text-center">
            <h2 className="hero-title text-4xl sm:text-5xl md:text-6xl mb-6">
              <span className="text-white">READY TO START </span>
              <span className="neon-text">WINNING?</span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 font-light">
              Join <span className="text-cyan-400 font-semibold">thousands of players</span> competing daily for real prizes
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/register"
                className="cta-button px-12 py-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white rounded-lg text-xl font-bold shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)' }}
              >
                Create Free Account
              </Link>
              <Link
                href="/matches"
                className="cta-button px-12 py-6 bg-transparent border-2 border-purple-400 text-purple-400 rounded-lg text-xl font-bold hover:bg-purple-400/10 transition-all duration-300 hover:scale-105"
              >
                Browse Matches
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 px-4 bg-black/40">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="hero-title text-4xl sm:text-5xl md:text-6xl mb-6">
                <span className="text-white">HOW IT </span>
                <span className="neon-text">WORKS</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: '1', title: 'Sign Up', desc: 'Create your free account in seconds', color: 'cyan' },
                { step: '2', title: 'Add Funds', desc: 'Deposit money securely via UPI/Cards', color: 'purple' },
                { step: '3', title: 'Join Match', desc: 'Pick a match and receive room details', color: 'pink' },
                { step: '4', title: 'Win & Withdraw', desc: 'Win prizes and withdraw anytime', color: 'blue' },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className="text-center"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.15}s backwards`
                  }}
                >
                  <div className={`step-indicator w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-45`}>
                    <span className="hero-title text-3xl font-black text-white -rotate-45">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white tracking-wide">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AEO Quick Answer Section - For Featured Snippets */}
        <section className="py-16 px-4 bg-gradient-to-b from-black/40 to-gray-900/40">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border-l-4 border-cyan-500 rounded-r-xl p-8">
              <h2 className="text-xl font-bold text-cyan-400 mb-4">What is BattleZone?</h2>
              <p className="text-lg text-gray-200 leading-relaxed">
                <strong className="text-white">BattleZone</strong> is India's premier esports platform for
                <strong className="text-cyan-400"> BGMI, PUBG Mobile, and Free Fire tournaments</strong> with real money prizes.
                Join <strong className="text-cyan-400">50,000+ active players</strong> competing in skill-based matches
                with entry fees starting from <strong className="text-cyan-400">₹10</strong>. Winners receive prizes directly
                to their wallet and can withdraw via <strong className="text-cyan-400">UPI within 24-48 hours</strong>.
                Our advanced anti-cheat system ensures fair play for all participants.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQ
          faqs={homepageFAQs}
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about playing on BattleZone"
          showSchema={true}
          className="bg-black/40"
        />
      </main>

      <Footer />
    </>
  );
}