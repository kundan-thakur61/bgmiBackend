'use client';

import { useEffect, useState } from 'react';
import { Navbar, Footer } from '@/components/layout';
import FAQ, { homepageFAQs } from '@/components/ui/FAQ';
import { faqSchema } from '@/lib/faq-schema';
import HeroSection from '@/components/home/HeroSection';
import LiveChallenges from '@/components/home/LiveChallenges';
import SupportedGames from '@/components/home/SupportedGames';
import FeaturesSection from '@/components/home/FeaturesSection';
import CTASection from '@/components/home/CTASection';
import HowItWorksSection from '@/components/home/HowItWorksSection';

// Import external CSS for performance (enables browser caching)
import '@/styles/hero-styles.css';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Performance monitoring
    const handlePerformance = () => {
      if (typeof window !== 'undefined') {
        // Check memory usage if available and huge
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

        // Initialize
        if (motionQuery.matches) {
          document.body.classList.add('reduce-motion');
        }

        motionQuery.addEventListener('change', handleMotionChange);

        return () => {
          motionQuery.removeEventListener('change', handleMotionChange);
        };
      }
    };

    return handlePerformance();
  }, []);

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
        <HeroSection />
        <LiveChallenges />
        <SupportedGames />
        <FeaturesSection />
        <CTASection />
        <HowItWorksSection />

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