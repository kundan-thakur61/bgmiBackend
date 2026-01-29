import { Navbar, Footer } from '@/components/layout';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata(
  'Privacy Policy',
  'Read the Privacy Policy for BattleZone. Learn how we collect, use, and protect your personal information on our esports gaming platform.',
  ['privacy policy', 'data protection', 'personal information', 'user privacy'],
  'https://battlezone.com/privacy-policy'
);

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      
      <main className="min-h-screen pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold font-display mb-4">Privacy Policy</h1>
          <p className="text-dark-400 mb-8">Last updated: January 1, 2025</p>

          <div className="space-y-8 text-dark-300">
            {/* Introduction */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
              <p className="mb-4">
                BattleZone (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and mobile application (the &quot;Platform&quot;).
              </p>
              <p>
                Please read this Privacy Policy carefully. By using the Platform, you consent to the practices described in this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="font-semibold text-white mt-4 mb-2">2.1 Personal Information</h3>
              <p className="mb-2">We collect information that you provide directly to us:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Account Information:</strong> Name, email address, phone number, date of birth</li>
                <li><strong>Identity Verification:</strong> Government ID (Aadhaar, PAN), selfie for KYC</li>
                <li><strong>Gaming Information:</strong> In-game ID, username, game statistics</li>
                <li><strong>Payment Information:</strong> UPI ID, bank account details for withdrawals</li>
                <li><strong>Communication:</strong> Support tickets, chat messages, feedback</li>
              </ul>

              <h3 className="font-semibold text-white mt-4 mb-2">2.2 Automatically Collected Information</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on Platform</li>
                <li><strong>Location Data:</strong> IP address, approximate geographic location</li>
                <li><strong>Cookies:</strong> Session cookies, preference cookies, analytics cookies</li>
              </ul>

              <h3 className="font-semibold text-white mt-4 mb-2">2.3 Game Screenshots</h3>
              <p>
                When you submit match results, we collect and analyze game screenshots including EXIF metadata for verification and anti-cheat purposes.
              </p>
            </section>

            {/* How We Use Information */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">3. How We Use Your Information</h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Create and manage your account</li>
                <li>Process transactions and payouts</li>
                <li>Verify your identity (KYC compliance)</li>
                <li>Prevent fraud and ensure fair play</li>
                <li>Organize matches and tournaments</li>
                <li>Send notifications about matches, results, and updates</li>
                <li>Provide customer support</li>
                <li>Improve our Platform and develop new features</li>
                <li>Comply with legal obligations</li>
                <li>Enforce our Terms and Conditions</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">4. Information Sharing</h2>
              <p className="mb-4">We may share your information with:</p>
              
              <h3 className="font-semibold text-white mt-4 mb-2">4.1 Service Providers</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Payment processors (Razorpay) for handling transactions</li>
                <li>Cloud services (AWS) for hosting and storage</li>
                <li>Analytics providers for understanding Platform usage</li>
                <li>Communication services for SMS and email notifications</li>
              </ul>

              <h3 className="font-semibold text-white mt-4 mb-2">4.2 Legal Requirements</h3>
              <p className="mb-4">We may disclose your information if required by law or in response to:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Court orders or legal processes</li>
                <li>Government or regulatory requests</li>
                <li>Protection of our rights, property, or safety</li>
                <li>Prevention of fraud or illegal activities</li>
              </ul>

              <h3 className="font-semibold text-white mt-4 mb-2">4.3 Public Information</h3>
              <p>
                Your username, gaming statistics, and tournament rankings may be publicly visible on leaderboards and match results pages.
              </p>
            </section>

            {/* Data Security */}
            <section className="card p-6 border border-green-500/20">
              <h2 className="text-xl font-bold text-green-400 mb-4">5. Data Security</h2>
              <p className="mb-4">We implement industry-standard security measures to protect your data:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Encryption:</strong> All data is encrypted in transit (TLS) and at rest</li>
                <li><strong>Access Controls:</strong> Strict access controls for employee access to data</li>
                <li><strong>Regular Audits:</strong> Security audits and vulnerability assessments</li>
                <li><strong>Secure Storage:</strong> KYC documents stored in encrypted cloud storage</li>
                <li><strong>Payment Security:</strong> PCI-DSS compliant payment processing</li>
              </ul>
              <p className="mt-4 text-dark-400">
                While we strive to protect your information, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            {/* Data Retention */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">6. Data Retention</h2>
              <p className="mb-4">We retain your information for as long as:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Your account is active</li>
                <li>Necessary to provide our Services</li>
                <li>Required by law (typically 7 years for financial records)</li>
                <li>Needed to resolve disputes or enforce agreements</li>
              </ul>
              <p className="mt-4">
                After account deletion, we may retain anonymized data for analytics purposes.
              </p>
            </section>

            {/* Your Rights */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">7. Your Rights</h2>
              <p className="mb-4">You have the following rights regarding your personal data:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Portability:</strong> Request your data in a portable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Withdraw Consent:</strong> Withdraw previously given consent</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us at privacy@battlezone.com or through our support system.
              </p>
            </section>

            {/* Cookies */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">8. Cookies and Tracking</h2>
              <p className="mb-4">We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Keep you logged in to your account</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze Platform usage and performance</li>
                <li>Prevent fraud and enhance security</li>
              </ul>
              <p className="mb-4">Types of cookies we use:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Essential Cookies:</strong> Required for Platform functionality</li>
                <li><strong>Analytics Cookies:</strong> Help us understand usage patterns</li>
                <li><strong>Preference Cookies:</strong> Remember your settings</li>
              </ul>
              <p className="mt-4">
                You can manage cookie preferences through your browser settings. Note that disabling certain cookies may affect Platform functionality.
              </p>
            </section>

            {/* Third-Party Links */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">9. Third-Party Links</h2>
              <p>
                Our Platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read the privacy policies of any third-party sites you visit.
              </p>
            </section>

            {/* Children */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">10. Children&apos;s Privacy</h2>
              <p>
                Our Platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information.
              </p>
            </section>

            {/* International Users */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">11. International Users</h2>
              <p>
                Our Platform is operated from India and is intended for users in India only. If you access our Platform from outside India, please be aware that your information may be transferred to, stored, and processed in India where our servers are located.
              </p>
            </section>

            {/* Changes */}
            <section className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">12. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            {/* Contact */}
            <section className="card p-6 bg-primary-500/5 border border-primary-500/20">
              <h2 className="text-xl font-bold text-white mb-4">13. Contact Us</h2>
              <p className="mb-4">
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <ul className="space-y-2">
                <li><strong>Email:</strong> privacy@battlezone.com</li>
                <li><strong>Data Protection Officer:</strong> dpo@battlezone.com</li>
                <li><strong>Support:</strong> <a href="/tickets" className="text-primary-400 hover:underline">Create a support ticket</a></li>
              </ul>
            </section>

            {/* Summary */}
            <section className="card p-6 bg-dark-700/50">
              <h2 className="text-xl font-bold text-white mb-4">Quick Summary</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>We encrypt all sensitive data</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>We never sell your personal data</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>You can request data deletion anytime</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>We use cookies only for essential functions</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>KYC data is stored securely</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>We comply with Indian data laws</span>
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
