import { Navbar, Footer } from '@/components/layout';
import { createMetadata } from '@/lib/metadata';
import { FAQSchema } from '@/components/seo';

export const metadata = createMetadata(
  'Frequently Asked Questions',
  'Find answers to common questions about BattleZone esports platform. Learn about matches, tournaments, payments, withdrawals, and more.',
  ['FAQ', 'help', 'questions', 'esports help', 'gaming support'],
  'https://battlezone.com/faq'
);

export default function FAQPage() {
  const faqs = [
    {
      question: 'How do I join a match on BattleZone?',
      answer: "Sign up for an account, complete KYC verification, add money to your wallet, browse available matches, and click join. You'll receive room details (room ID and password) before the match starts via the app and notifications.",
    },
    {
      question: 'What games are available on BattleZone?',
      answer: 'BattleZone offers PUBG Mobile, BGMI, and Free Fire matches including solo matches, duo matches, squad matches, TDM matches, and special tournament formats with real money prizes.',
    },
    {
      question: 'How are match results verified?',
      answer: 'Players upload match screenshots after completion. Our anti-cheat system verifies using EXIF data analysis, duplicate image detection, and manual admin review to prevent fraud and ensure fair results.',
    },
    {
      question: 'When can I withdraw my winnings?',
      answer: 'After KYC verification is complete and you meet the minimum withdrawal amount (₹100), withdrawals are processed within 24-48 hours via UPI or bank transfer.',
    },
    {
      question: 'Is BattleZone legal in India?',
      answer: 'Yes, BattleZone operates as a skill-based gaming platform, not gambling. All games are competitive and skill-based, compliant with Indian gaming regulations. However, users from states where such platforms are prohibited should not participate.',
    },
    {
      question: 'How do tournaments work on BattleZone?',
      answer: 'Tournaments have limited slots with auto prize pool calculation. Players compete in solo, duo, or squad formats across multiple rounds. A leaderboard tracks rankings, and winners are announced after tournament completion.',
    },
    {
      question: 'What is the minimum deposit amount?',
      answer: 'The minimum deposit amount is ₹10. You can add money using UPI, debit cards, credit cards, or net banking through our secure payment gateway powered by Razorpay.',
    },
    {
      question: 'How do I complete KYC verification?',
      answer: 'Go to Profile > KYC Verification, upload a clear photo of your Aadhaar card (front and back) or PAN card, and a selfie. Verification is usually completed within 24 hours.',
    },
    {
      question: 'What happens if I disconnect during a match?',
      answer: 'Unfortunately, disconnections are treated as part of gameplay. We recommend having a stable internet connection before joining matches. For technical issues on our end, refunds may be processed.',
    },
    {
      question: 'How do I report a cheater or fraudulent player?',
      answer: 'You can report players by creating a support ticket with evidence (screenshots, video recordings). Our team reviews all reports within 24-48 hours and takes appropriate action.',
    },
  ];

  return (
    <>
      <FAQSchema />
      <Navbar />
      
      <main className="min-h-screen pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold font-display mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-dark-400">
              Find answers to common questions about BattleZone
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="card group">
                <summary className="p-6 cursor-pointer list-none flex justify-between items-center">
                  <h2 className="font-semibold pr-4">{faq.question}</h2>
                  <span className="text-primary-400 group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-dark-300">
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="mt-12 text-center card p-8">
            <h2 className="text-xl font-semibold mb-2">Still have questions?</h2>
            <p className="text-dark-400 mb-4">Our support team is here to help</p>
            <a href="/tickets" className="btn-primary">
              Contact Support
            </a>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
