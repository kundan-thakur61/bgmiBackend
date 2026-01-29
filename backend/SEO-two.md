# BattleZone SEO - Ready-to-Use Code Files

## 📁 Copy these files into your Next.js project

---

## 1. `lib/metadata.ts`

```typescript
import { Metadata } from 'next';

export const SITE_CONFIG = {
  name: 'BattleZone',
  baseUrl: 'https://battlezone.com',
  description: 'Play PUBG Mobile & Free Fire tournaments for real money',
  author: 'BattleZone',
  twitterHandle: '@BattleZone',
  ogImage: 'https://battlezone.com/og-image.jpg',
};

export const createMetadata = (
  title: string,
  description: string,
  keywords?: string[],
  canonicalUrl?: string,
  ogImage?: string,
  ogType: 'website' | 'article' | 'event' = 'website'
): Metadata => {
  const fullTitle = `${title} | BattleZone`;
  const imageUrl = ogImage || SITE_CONFIG.ogImage;
  const canonical = canonicalUrl || SITE_CONFIG.baseUrl;

  return {
    title: fullTitle,
    description,
    keywords: [
      'BattleZone',
      'esports',
      'PUBG Mobile',
      'Free Fire',
      'competitive gaming',
      'real money gaming',
      'esports tournaments',
      'India esports',
      ...(keywords || []),
    ],
    authors: [{ name: SITE_CONFIG.author }],
    creator: SITE_CONFIG.author,
    publisher: SITE_CONFIG.author,
    openGraph: {
      type: ogType,
      locale: 'en_IN',
      url: canonical,
      siteName: SITE_CONFIG.name,
      title: fullTitle,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitterHandle,
      creator: SITE_CONFIG.twitterHandle,
      title: fullTitle,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: canonical,
    },
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-icon.png',
      shortcut: '/favicon-32x32.png',
    },
    manifest: '/site.webmanifest',
  };
};

export const defaultMetadata: Metadata = createMetadata(
  'Premium Esports Gaming Platform',
  'Join BattleZone - India\'s fastest-growing esports platform for PUBG Mobile and Free Fire tournaments. Play, win, and withdraw real money instantly.',
  [
    'esports platform',
    'competitive gaming',
    'real money tournaments',
    'skill-based games',
    'Indian esports',
  ]
);
```

---

## 2. `app/sitemap.ts`

```typescript
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://battlezone.com';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/matches`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tournaments`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/wallet`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/rules`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/fair-play`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms-conditions`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  return staticPages;
}
```

---

## 3. `app/robots.ts`

```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/admin/',
          '/api/',
          '/private/',
          '/wallet/secret',
          '/profile/settings',
          '/*.json$',
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        crawlDelay: 0.5,
      },
      {
        userAgent: 'Bingbot',
        allow: ['/'],
        crawlDelay: 1,
      },
    ],
    sitemap: 'https://battlezone.com/sitemap.xml',
    host: 'https://battlezone.com',
  };
}
```

---

## 4. `public/site.webmanifest`

```json
{
  "name": "BattleZone - Competitive Esports Platform",
  "short_name": "BattleZone",
  "description": "Play PUBG Mobile and Free Fire tournaments for real money on India's fastest-growing esports platform.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/maskable-icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["games", "sports"],
  "screenshots": [
    {
      "src": "/screenshot-mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshot-desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "shortcuts": [
    {
      "name": "Browse Matches",
      "short_name": "Matches",
      "description": "View available competitive matches",
      "url": "/matches",
      "icons": [{ "src": "/match-icon.png", "sizes": "96x96", "type": "image/png" }]
    },
    {
      "name": "View Tournaments",
      "short_name": "Tournaments",
      "description": "Browse esports tournaments",
      "url": "/tournaments",
      "icons": [{ "src": "/tournament-icon.png", "sizes": "96x96", "type": "image/png" }]
    }
  ]
}
```

---

## 5. `public/robots.txt`

```txt
# Allow Google, Bing, and other search engines
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /private/
Disallow: /wallet/secret
Disallow: /profile/settings
Disallow: /*.json$
Crawl-delay: 1
Request-rate: 30/60

# Google specific
User-agent: Googlebot
Allow: /
Crawl-delay: 0.5

# Bing specific
User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Prevent indexing of staging/test domains
User-agent: *
Disallow: /test/
Disallow: /staging/

# Sitemap locations
Sitemap: https://battlezone.com/sitemap.xml
```

---

## 6. `components/Schema.tsx`

```typescript
'use client';

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BattleZone',
    url: 'https://battlezone.com',
    logo: 'https://battlezone.com/logo.png',
    description: 'India\'s premier esports gaming platform for PUBG Mobile and Free Fire tournaments.',
    foundingDate: '2024',
    foundingLocation: {
      '@type': 'Place',
      name: 'Dhanbad, Jharkhand, India',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressLocality: 'Dhanbad',
      addressRegion: 'JH',
    },
    contact: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@battlezone.com',
      url: 'https://battlezone.com/contact',
    },
    sameAs: [
      'https://twitter.com/BattleZone',
      'https://facebook.com/BattleZone',
      'https://instagram.com/BattleZone',
      'https://youtube.com/@BattleZone',
      'https://discord.gg/BattleZone',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  );
}

export function FAQSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I join a match on BattleZone?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sign up for an account, complete KYC verification, add money to your wallet, browse available matches, and click join. You\'ll receive room details before the match starts.',
        },
      },
      {
        '@type': 'Question',
        name: 'What games are available on BattleZone?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'BattleZone offers PUBG Mobile and Free Fire matches including solo matches, duo matches, squad matches, and special tournament formats with real money prizes.',
        },
      },
      {
        '@type': 'Question',
        name: 'How are match results verified?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Players upload match screenshots after completion. Our anti-cheat system verifies using EXIF data analysis, duplicate image detection, and manual admin review to prevent fraud.',
        },
      },
      {
        '@type': 'Question',
        name: 'When can I withdraw my winnings?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'After KYC verification is complete and you meet the minimum withdrawal amount, withdrawals are processed within 24-48 hours via UPI or bank transfer.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is BattleZone legal in India?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, BattleZone operates as a skill-based gaming platform, not gambling. All games are competitive and skill-based, compliant with Indian gaming regulations.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do tournaments work on BattleZone?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Tournaments have limited slots with auto prize pool calculation. Players compete in solo, duo, or squad formats. A leaderboard tracks rankings, and winners are announced after tournament completion.',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  );
}

export function BreadcrumbSchema({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  );
}

export function MatchSchema({ match }: { match: any }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${match.gameType} ${match.matchType} - Prize ₹${match.prize}`,
    description: `Join this competitive ${match.gameType} ${match.matchType} match. Entry fee: ₹${match.entryFee}. Prize: ₹${match.prize}. Max slots: ${match.maxSlots}`,
    startDate: new Date(match.startTime).toISOString(),
    endDate: new Date(match.endTime).toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: 'https://battlezone.com',
    },
    offers: {
      '@type': 'Offer',
      price: match.entryFee,
      priceCurrency: 'INR',
      availability: match.remainingSlots > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://battlezone.com/matches/${match.id}`,
    },
    organizer: {
      '@type': 'Organization',
      name: 'BattleZone',
      url: 'https://battlezone.com',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  );
}
```

---

## 7. `components/Analytics.tsx`

```typescript
'use client';

import Script from 'next/script';

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
              page_title: document.title,
              anonymize_ip: true,
            });
          `,
        }}
      />
    </>
  );
}

export function GoogleSearchConsole({
  verificationCode,
}: {
  verificationCode: string;
}) {
  return (
    <meta
      name="google-site-verification"
      content={verificationCode}
    />
  );
}
```

---

## 8. `next.config.js` (Performance Optimizations)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  httpAgentOptions: {
    keepAlive: true,
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [
      'battlezone.com',
      'cdn.battlezone.com',
      'res.cloudinary.com',
      'cloudinary.com',
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox;",
  },
  swcMinify: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      'lodash-es',
    ],
  },
  headers: async () => {
    return [
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, must-revalidate',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  redirects: async () => {
    return [
      {
        source: '/old-matches',
        destination: '/matches',
        permanent: true, // 301 redirect
      },
      {
        source: '/old-tournaments',
        destination: '/tournaments',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## 9. `app/layout.tsx` (Complete Layout)

```typescript
import type { Metadata, Viewport } from 'next';
import { defaultMetadata } from '@/lib/metadata';
import { OrganizationSchema } from '@/components/Schema';
import { GoogleAnalytics } from '@/components/Analytics';

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="msapplication-TileColor" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BattleZone" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />

        <OrganizationSchema />
      </head>
      <body>
        {children}
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
```

---

## 10. `.env.local` Configuration

```env
# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Search Console Verification
NEXT_PUBLIC_GSC_VERIFICATION=your_verification_code

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://battlezone.com
NEXT_PUBLIC_SITE_NAME=BattleZone

# Image CDN
NEXT_PUBLIC_CDN_URL=https://res.cloudinary.com/battlezone

# API
NEXT_PUBLIC_API_URL=https://api.battlezone.com
```

---

## ✅ Implementation Steps

1. **Copy files** - Place files in your Next.js project structure
2. **Update environment variables** - Add GA ID and verification code
3. **Update branding** - Replace BattleZone with your site name where needed
4. **Update URLs** - Replace battlezone.com with your domain
5. **Submit to Google Search Console** - Verify ownership
6. **Monitor** - Check GSC and Analytics regularly

---

**All ready to go! 🚀**
