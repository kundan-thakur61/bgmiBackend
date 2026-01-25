import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { href: '/matches', label: 'Matches' },
      { href: '/tournaments', label: 'Tournaments' },
      { href: '/how-it-works', label: 'How It Works' },
      { href: '/faq', label: 'FAQ' },
    ],
    legal: [
      { href: '/rules', label: 'Rules' },
      { href: '/fair-play', label: 'Fair Play' },
      { href: '/privacy-policy', label: 'Privacy Policy' },
      { href: '/terms-conditions', label: 'Terms & Conditions' },
    ],
    support: [
      { href: '/tickets', label: 'Support Tickets' },
      { href: '/contact', label: 'Contact Us' },
      { href: '/kyc', label: 'KYC Verification' },
    ],
  };

  const socialLinks = [
    { href: 'https://twitter.com/BattleZone', label: 'Twitter', icon: 'X' },
    { href: 'https://facebook.com/BattleZone', label: 'Facebook', icon: 'FB' },
    { href: 'https://instagram.com/BattleZone', label: 'Instagram', icon: 'IG' },
    { href: 'https://discord.gg/BattleZone', label: 'Discord', icon: 'DC' },
    { href: 'https://youtube.com/@BattleZone', label: 'YouTube', icon: 'YT' },
  ];

  return (
    <footer className="bg-dark-950 border-t border-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-gaming-purple rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-xl font-bold font-display gradient-text">BattleZone</span>
            </Link>
            <p className="text-dark-400 text-sm mb-4">
              India&apos;s premier esports platform for PUBG Mobile and Free Fire tournaments. Play, win, and withdraw real money.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-dark-800 hover:bg-dark-700 rounded-lg flex items-center justify-center text-dark-400 hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <span className="text-xs font-bold">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Platform</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-dark-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-dark-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-dark-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-dark-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-dark-500 text-sm">
              © {currentYear} BattleZone. All rights reserved.
            </p>
            <p className="text-dark-500 text-xs text-center md:text-right">
              BattleZone is a skill-based gaming platform. All games are competitive and based on player skill.
              <br />
              Not available in states where prohibited by law.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
