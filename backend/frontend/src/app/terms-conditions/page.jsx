import { Navbar, Footer } from '@/components/layout';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata(
  'Terms and Conditions',
  'Read the Terms and Conditions for using BattleZone esports gaming platform. Understand our rules, policies, and user agreements.',
  ['terms and conditions', 'user agreement', 'platform rules', 'legal'],
  'https://battlezone.com/terms-conditions'
);

export default function TermsConditionsPage() {
  return (
    <>
      <Navbar />
      
      <main className="min-h-screen pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold font-display mb-4">Terms and Conditions</h1>
          <p className="text-dark-400 mb-8">Last updated: January 1, 2025</p>

          <div className="space-y-8 text-dark-300">
            {/* Introduction */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
              <p className="mb-4">
                Welcome to BattleZone (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). These Terms and Conditions (&quot;Terms&quot;) govern your use of our website, mobile application, and services (collectively, the &quot;Services&quot;).
              </p>
              <p>
                By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Services.
              </p>
            </section>

            {/* Eligibility */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">2. Eligibility</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>You must be at least 18 years of age to use our paid Services.</li>
                <li>You must be a resident of India (excluding states where online skill-based gaming is prohibited).</li>
                <li>You must provide accurate and complete registration information.</li>
                <li>You must not have any previously suspended or terminated accounts.</li>
                <li>You must comply with all applicable laws and regulations.</li>
              </ul>
            </section>

            {/* Account Registration */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">3. Account Registration</h2>
              <p className="mb-4">To access certain features of our Services, you must create an account. When creating an account:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>You agree to provide accurate, current, and complete information.</li>
                <li>You agree to maintain and update your information to keep it accurate.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You are responsible for all activities that occur under your account.</li>
                <li>You agree to notify us immediately of any unauthorized use of your account.</li>
              </ul>
            </section>

            {/* Gaming Rules */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">4. Gaming Rules and Fair Play</h2>
              <p className="mb-4">By participating in matches and tournaments, you agree to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Follow all game-specific rules and guidelines.</li>
                <li>Not use any cheats, hacks, or third-party software that provides unfair advantages.</li>
                <li>Not engage in match-fixing, result manipulation, or any form of fraud.</li>
                <li>Not create multiple accounts to gain unfair advantages.</li>
                <li>Treat other players with respect and avoid toxic behavior.</li>
                <li>Submit accurate results and screenshots when required.</li>
              </ul>
              <p className="mt-4">
                Violation of these rules may result in account suspension, forfeiture of winnings, and permanent ban from the Platform.
              </p>
            </section>

            {/* Payments */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">5. Payments and Wallet</h2>
              <h3 className="font-semibold text-white mt-4 mb-2">5.1 Deposits</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Minimum deposit amount is ₹10.</li>
                <li>All deposits are processed through secure payment gateways.</li>
                <li>Deposited funds are non-transferable and cannot be withdrawn directly.</li>
                <li>Bonus funds have separate terms and wagering requirements.</li>
              </ul>
              
              <h3 className="font-semibold text-white mt-4 mb-2">5.2 Withdrawals</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Minimum withdrawal amount is ₹100.</li>
                <li>KYC verification must be completed before withdrawal.</li>
                <li>Withdrawals are processed within 24-48 hours.</li>
                <li>We reserve the right to verify the source of funds.</li>
              </ul>

              <h3 className="font-semibold text-white mt-4 mb-2">5.3 Refunds</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Entry fees are non-refundable once a match has started.</li>
                <li>Refunds for cancelled matches are processed within 24 hours.</li>
                <li>Disputed transactions are handled case-by-case.</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">6. Intellectual Property</h2>
              <p className="mb-4">
                All content, features, and functionality of the Platform, including but not limited to text, graphics, logos, icons, images, and software, are the exclusive property of BattleZone and are protected by Indian and international copyright, trademark, and other intellectual property laws.
              </p>
              <p>
                You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Platform without our prior written consent.
              </p>
            </section>

            {/* Prohibited Activities */}
            <section className="card p-6 border border-red-500/20">
              <h2 className="text-xl font-bold text-red-400 mb-4">7. Prohibited Activities</h2>
              <p className="mb-4">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Use the Platform for any illegal purpose or in violation of any laws.</li>
                <li>Attempt to gain unauthorized access to our systems or user accounts.</li>
                <li>Use automated scripts, bots, or other tools to interact with the Platform.</li>
                <li>Upload or transmit viruses, malware, or other malicious code.</li>
                <li>Harass, abuse, or harm other users.</li>
                <li>Impersonate any person or entity.</li>
                <li>Collect user information without consent.</li>
                <li>Interfere with or disrupt the Platform or servers.</li>
              </ul>
            </section>

            {/* Disclaimer */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">8. Disclaimer of Warranties</h2>
              <p className="mb-4">
                THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              </p>
              <p>
                We are not responsible for any technical failures, server downtime, or connectivity issues that may affect your gaming experience.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">9. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, BATTLEZONE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE PLATFORM.
              </p>
            </section>

            {/* Termination */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">10. Termination</h2>
              <p className="mb-4">
                We reserve the right to suspend or terminate your account at any time for any reason, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Violation of these Terms.</li>
                <li>Fraudulent or illegal activity.</li>
                <li>Cheating or unfair play.</li>
                <li>Requests from law enforcement.</li>
                <li>Discontinuation of the Platform.</li>
              </ul>
            </section>

            {/* Governing Law */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">11. Governing Law and Dispute Resolution</h2>
              <p className="mb-4">
                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka.
              </p>
              <p>
                Before initiating any legal proceedings, you agree to attempt to resolve any disputes through good-faith negotiations for a period of at least 30 days.
              </p>
            </section>

            {/* Changes */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">12. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Platform after such changes constitutes your acceptance of the new Terms.
              </p>
            </section>

            {/* Contact */}
            <section className="card p-6 bg-primary-500/5 border border-primary-500/20">
              <h2 className="text-xl font-bold text-white mb-4">13. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <ul className="space-y-2">
                <li><strong>Email:</strong> legal@battlezone.com</li>
                <li><strong>Support:</strong> <a href="/tickets" className="text-primary-400 hover:underline">Create a support ticket</a></li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
