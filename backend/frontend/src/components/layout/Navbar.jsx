'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import SearchBar from '@/components/ui/SearchBar';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { href: '/matches', label: 'Matches' },
    { href: '/tournaments', label: 'Tournaments' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/how-it-works', label: 'How It Works' },
  ];

  const authenticatedNavLinks = [
    { href: '/create-match', label: 'Create Match' },
    ...navLinks
  ];

  const displayNavLinks = isAuthenticated ? authenticatedNavLinks : navLinks;

  const userLinks = [
    { href: '/wallet', label: 'Wallet' },
    { href: '/profile', label: 'Profile' },
    { href: '/notifications', label: 'Notifications' },
  ];

  const mobileNavItems = [
    {
      href: '/', label: 'Home', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      href: '/matches', label: 'Matches', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      href: '/tournaments', label: 'Tournaments', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      )
    },
    {
      href: '/create-match', label: 'Create Match', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      href: '/wallet', label: 'Wallet', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      href: '/profile', label: 'Profile', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-lg border-b border-dark-700 md:block hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-gaming-purple rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-xl font-bold font-display gradient-text">BattleZone</span>
            </Link>

            <div className="flex items-center space-x-1">
              {displayNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-dark-200 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <SearchBar className="w-48 hidden lg:block" />
              {isAuthenticated ? (
                <>
                  <Link href="/wallet" className="btn-ghost">
                    <span className="text-green-400 font-semibold">₹{user?.walletBalance || 0}</span>
                  </Link>
                  <Link href="/profile" className="btn-secondary">
                    {user?.username || 'Profile'}
                  </Link>
                  <button onClick={() => logout()} className="btn-ghost text-dark-400 hover:text-red-400">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost">
                    Login
                  </Link>
                  <Link href="/register" className="btn-primary">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-lg border-b border-dark-700 md:hidden">
        <div className="px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-gaming-purple rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-lg font-bold font-display gradient-text">BattleZone</span>
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {isMenuOpen && (
            <div className="py-4 border-t border-dark-700 animate-slideDown shadow-xl bg-dark-900/95 backdrop-blur-xl absolute top-full left-0 right-0 z-50">
              <div className="space-y-1">
                {displayNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-3 text-dark-200 hover:text-white hover:bg-dark-800 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                {isAuthenticated && (
                  <>
                    <div className="my-2 border-t border-dark-700" />
                    {userLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-3 text-dark-200 hover:text-white hover:bg-dark-800 rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </>
                )}

                <div className="my-2 border-t border-dark-700" />

                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-red-400 hover:bg-dark-800 rounded-lg"
                  >
                    Logout
                  </button>
                ) : (
                  <div className="flex flex-col space-y-2 px-4">
                    <Link href="/login" className="btn-secondary w-full text-center" onClick={() => setIsMenuOpen(false)}>
                      Login
                    </Link>
                    <Link href="/register" className="btn-primary w-full text-center" onClick={() => setIsMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-lg border-t border-dark-700 md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${isActive
                  ? 'text-primary-400'
                  : 'text-dark-400 hover:text-white'
                  }`}
              >
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
