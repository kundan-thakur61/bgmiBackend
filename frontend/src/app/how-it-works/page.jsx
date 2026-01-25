import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { pageMetadata } from '@/lib/metadata';
import { HowToSchema, FAQSchema } from '@/components/seo';

export const metadata = pageMetadata.howItWorks;

// HowTo Schema data
const howToData = {
  name: 'How to Play BGMI Tournaments on BattleZone',
  description: 'Complete guide to joining and playing BGMI, PUBG Mobile, and Free Fire tournaments on BattleZone for real money prizes.',
  totalTime: 'PT10M',
  cost: '10',
  steps: [
    { name: 'Create Your Account', text: 'Sign up with your email, phone number, and in-game ID. Verification takes just a few minutes.' },
    { name: 'Complete KYC', text: 'Upload your Aadhaar or PAN card for identity verification. This ensures a secure gaming environment.' },
    { name: 'Add Funds', text: 'Deposit money securely via UPI, cards, or net banking. Minimum deposit is just ₹10.' },
    { name: 'Browse & Join Matches', text: 'Choose from BGMI, PUBG Mobile, or Free Fire matches. Select your preferred game mode and entry fee.' },
    { name: 'Get Room Details', text: 'Before match starts, receive room ID and password via app notification and in your dashboard.' },
    { name: 'Play & Win', text: 'Join the room, compete with other players, and climb the leaderboard to win prizes.' },
    { name: 'Upload Results', text: 'After match completion, upload your game screenshot showing kills and rank for verification.' },
    { name: 'Withdraw Winnings', text: 'Once results are verified, winnings are credited to your wallet. Withdraw anytime via UPI or bank.' },
  ],
};

// FAQ data for how it works page
const howItWorksFAQs = [
  { question: 'How long does account verification take?', answer: 'Account creation is instant with OTP verification. KYC verification typically takes 2-4 hours during business hours, or up to 24 hours during peak times.' },
  { question: 'What is the minimum amount to add to wallet?', answer: 'The minimum deposit amount is ₹50. You can use UPI, Paytm, cards, or net banking from any major Indian bank.' },
  { question: 'Can I play without completing KYC?', answer: 'You can join free matches without KYC, but to participate in paid matches and withdraw winnings, KYC verification is mandatory.' },
  { question: 'How early should I join the room?', answer: 'We recommend joining the custom room at least 5 minutes before the scheduled match time. Room credentials are shared 15 minutes before start.' },
];

export default function HowItWorksPage() {
  const steps = [
    {
      number: '01',
      title: 'Create Your Account',
      description: 'Sign up with your email, phone number, and in-game ID. Verification takes just a few minutes.',
      icon: '👤',
    },
    {
      number: '02',
      title: 'Complete KYC',
      description: 'Upload your Aadhaar or PAN card for identity verification. This ensures a secure gaming environment.',
      icon: '📋',
    },
    {
      number: '03',
      title: 'Add Funds',
      description: 'Deposit money securely via UPI, cards, or net banking. Minimum deposit is just ₹10.',
      icon: '💰',
    },
    {
      number: '04',
      title: 'Browse & Join Matches',
      description: 'Choose from PUBG Mobile, BGMI, or Free Fire matches. Select your preferred game mode and entry fee.',
      icon: '🎮',
    },
    {
      number: '05',
      title: 'Get Room Details',
      description: 'Before match starts, receive room ID and password via app notification and in your dashboard.',
      icon: '🔑',
    },
    {
      number: '06',
      title: 'Play & Win',
      description: 'Join the room, compete with other players, and climb the leaderboard to win prizes.',
      icon: '🏆',
    },
    {
      number: '07',
      title: 'Upload Results',
      description: 'After match completion, upload your game screenshot showing kills and rank for verification.',
      icon: '📸',
    },
    {
      number: '08',
      title: 'Withdraw Winnings',
      description: 'Once results are verified, winnings are credited to your wallet. Withdraw anytime via UPI or bank.',
      icon: '💸',
    },
  ];

  const features = [
    {
      title: 'Anti-Cheat System',
      description: 'Advanced screenshot verification, EXIF data analysis, and duplicate detection to prevent fraud.',
      icon: '🛡️',
    },
    {
      title: 'Instant Notifications',
      description: 'Get real-time updates about match schedules, room details, and results via push notifications.',
      icon: '🔔',
    },
    {
      title: 'Multiple Game Modes',
      description: 'Solo, Duo, Squad, TDM, and Arena matches across PUBG Mobile, BGMI, and Free Fire.',
      icon: '🎯',
    },
    {
      title: '24/7 Support',
      description: 'Dedicated support team available round the clock to help with any issues or queries.',
      icon: '💬',
    },
  ];

  return (
    <>
      <HowToSchema howTo={howToData} />
      <FAQSchema faqs={howItWorksFAQs} />
      <Navbar />
      
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="py-16 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display mb-6">
              How <span className="gradient-text">BattleZone</span> Works
            </h1>
            <p className="text-lg text-dark-300 mb-8">
              Start playing competitive esports matches in minutes. Follow these simple steps to begin your journey.
            </p>
            <Link href="/register" className="btn-primary btn-lg">
              Get Started Now
            </Link>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 px-4 bg-dark-800/50">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {steps.map((step) => (
                <div key={step.number} className="card p-6 flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center text-2xl">
                      {step.icon}
                    </div>
                  </div>
                  <div>
                    <div className="text-primary-400 text-sm font-semibold mb-1">Step {step.number}</div>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-dark-400 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-center mb-12">
              Why Players Trust BattleZone
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="card p-6 text-center">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-dark-400 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-gradient-to-r from-primary-900/50 to-gaming-purple/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">
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
      </main>
      
      <Footer />
    </>
  );
}
