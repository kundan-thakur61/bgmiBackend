# BattleZone SEO Implementation Guide

**Complete production-ready SEO strategy for your esports gaming platform**

---

## 📋 Table of Contents
1. [Next.js SEO Setup](#nextjs-seo-setup)
2. [Keyword Strategy](#keyword-strategy)
3. [Technical SEO](#technical-seo)
4. [On-Page SEO](#on-page-seo)
5. [Content Strategy](#content-strategy)
6. [Link Building](#link-building)
7. [Monitoring & Analytics](#monitoring--analytics)
8. [Mobile & Speed Optimization](#mobile--speed-optimization)
9. [Structured Data & Schema](#structured-data--schema)
10. [Implementation Checklist](#implementation-checklist)

---

## 1. Next.js SEO Setup

### A. Metadata Configuration

Create `lib/metadata.ts`:

```typescript
import { Metadata } from 'next';

export const createMetadata = (
  title: string,
  description: string,
  keywords?: string[],
  canonicalUrl?: string,
  ogImage?: string,
  ogType: string = 'website'
): Metadata => {
  return {
    title: `${title} | BattleZone - Play Skill-Based Esports`,
    description,
    keywords: ['BattleZone', 'PUBG Mobile', 'Free Fire', 'Esports', 'Gaming', ...keywords],
    openGraph: {
      title: `${title} | BattleZone`,
      description,
      type: ogType as any,
      images: [
        {
          url: ogImage || 'https://battlezone.com/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'BattleZone - Premium Esports Platform',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | BattleZone`,
      description,
      images: [ogImage || 'https://battlezone.com/og-image.jpg'],
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
    canonical: canonicalUrl,
    alternates: {
      canonical: canonicalUrl,
    },
  };
};
```

### B. Root Layout Metadata

Update `app/layout.tsx`:

```typescript
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BattleZone - Play PUBG Mobile & Free Fire for Real Money',
  description: 'BattleZone is India\'s fastest-growing esports platform for competitive PUBG Mobile and Free Fire tournaments. Join skill-based matches, win real money, and withdraw instantly.',
  keywords: [
    'esports platform India',
    'PUBG Mobile tournaments',
    'Free Fire tournaments',
    'competitive gaming',
    'real money gaming',
    'skill-based matches',
    'esports matches paid',
  ],
  authors: [{ name: 'BattleZone' }],
  creator: 'BattleZone',
  publisher: 'BattleZone',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://battlezone.com',
    siteName: 'BattleZone',
    title: 'BattleZone - Play PUBG Mobile & Free Fire for Real Money',
    description: 'Join competitive esports matches on India\'s #1 gaming platform. Win real money in PUBG Mobile and Free Fire tournaments.',
    images: [
      {
        url: 'https://battlezone.com/og-hero-image.jpg',
        width: 1200,
        height: 630,
        alt: 'BattleZone Esports Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@BattleZone',
    creator: '@BattleZone',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BattleZone',
  },
  formatDetection: {
    telephone: false,
  },
};

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 2. Keyword Strategy

### A. Core Keywords by Category

**Head Keywords (High volume, competitive):**
- "PUBG Mobile tournaments India"
- "Free Fire esports tournaments"
- "Competitive gaming platform"
- "Real money esports games"
- "PUBG Mobile prizes"

**Long-tail Keywords (Lower volume, higher intent):**
- "How to join PUBG Mobile tournaments online"
- "Win real money playing PUBG Mobile"
- "Free Fire competitive matches entry fee"
- "Best esports platform for Indian gamers"
- "PUBG Mobile tournament registration online"
- "How to withdraw money from esports platform"
- "PUBG Mobile match room ID and password"
- "Skill-based gaming platform India"
- "TDM tournaments PUBG Mobile"
- "Squad matches Free Fire tournaments"

**Question-based Keywords (For content):**
- "How do esports tournaments work?"
- "What is a skill-based game?"
- "How to improve PUBG Mobile skills?"
- "What are tournament prizes based on?"
- "How to verify esports match results?"

### B. Keyword Mapping to Pages

| Page | Primary Keyword | Secondary Keywords |
|------|-----------------|-------------------|
| `/` | "esports platform India" | "PUBG Mobile tournaments", "Free Fire tournaments" |
| `/matches` | "PUBG Mobile competitive matches" | "entry fee matches", "win prizes" |
| `/tournaments` | "esports tournaments India" | "squad matches", "prize pool", "leaderboard" |
| `/how-it-works` | "how to play competitive esports" | "tournament rules", "match process" |
| `/rules` | "esports fair play policy" | "anti-cheat", "fraud prevention" |
| `/blog/pubg-tips` | "PUBG Mobile tips and tricks" | "PUBG competitive strategy" |
| `/blog/free-fire-guide` | "Free Fire tournament guide" | "Free Fire competitive tips" |

---

## 3. Technical SEO

### A. Sitemap Generation

Create `app/sitemap.ts`:

```typescript
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://battlezone.com';
  
  const staticPages = [
    { url: baseUrl, priority: 1.0, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/matches`, priority: 0.9, changeFrequency: 'hourly' as const },
    { url: `${baseUrl}/tournaments`, priority: 0.9, changeFrequency: 'hourly' as const },
    { url: `${baseUrl}/wallet`, priority: 0.8, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/profile`, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/admin`, priority: 0.5, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/how-it-works`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/rules`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/fair-play`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/privacy-policy`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/terms-conditions`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/blog`, priority: 0.7, changeFrequency: 'weekly' as const },
  ];

  // Fetch dynamic matches & tournaments from API
  const dynamicPages = [
    // Add matches, tournaments, player profiles dynamically
    // Example:
    { url: `${baseUrl}/matches/123`, priority: 0.7, changeFrequency: 'never' as const },
    { url: `${baseUrl}/tournaments/456`, priority: 0.7, changeFrequency: 'never' as const },
  ];

  return [...staticPages, ...dynamicPages];
}
```

### B. Robots.txt

Create `public/robots.txt`:

```txt
# Allow Google, Bing, other major search engines
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /wallet/secret
Disallow: /profile/private
Crawl-delay: 1
Request-rate: 30/60

# Google specific
User-agent: Googlebot
Allow: /
Crawl-delay: 0.5

# Sitemap location
Sitemap: https://battlezone.com/sitemap.xml
Sitemap: https://battlezone.com/sitemap-blog.xml

# Specify canonical
Sitemap: https://battlezone.com/sitemap-matches.xml
```

### C. Web Manifest

Create `public/site.webmanifest`:

```json
{
  "name": "BattleZone - Competitive Esports Platform",
  "short_name": "BattleZone",
  "description": "Play PUBG Mobile and Free Fire tournaments for real money on India's fastest-growing esports platform.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "orientation": "portrait-primary",
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
  "screenshots": [
    {
      "src": "/screenshot-mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "categories": ["games", "sports"],
  "screenshots": []
}
```

### D. robots.ts Configuration (Metadata API)

```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/wallet/secret', '/profile/private'],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 0.5,
      },
    ],
    sitemap: 'https://battlezone.com/sitemap.xml',
  };
}
```

---

## 4. On-Page SEO

### A. Page Component Template

Create `components/SEOPage.tsx`:

```typescript
import Head from 'next/head';
import Image from 'next/image';
import { createMetadata } from '@/lib/metadata';

interface SEOPageProps {
  title: string;
  description: string;
  keywords: string[];
  children: React.ReactNode;
  canonicalUrl?: string;
  ogImage?: string;
  jsonLd?: object;
}

export const SEOPage: React.FC<SEOPageProps> = ({
  title,
  description,
  keywords,
  children,
  canonicalUrl,
  ogImage,
  jsonLd,
}) => {
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <main role="main">
        {children}
      </main>
    </>
  );
};

export { createMetadata };
```

### B. Homepage Optimization

```typescript
// app/page.tsx
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata(
  'Premium Esports Gaming Platform',
  'Join BattleZone - India\'s fastest-growing esports platform for PUBG Mobile and Free Fire tournaments. Play, win, and withdraw real money instantly.',
  ['esports platform', 'competitive gaming', 'real money tournaments', 'PUBG Mobile', 'Free Fire'],
  'https://battlezone.com',
  'https://battlezone.com/og-hero.jpg'
);

export default function Home() {
  return (
    <div>
      <section>
        <h1>Play Competitive Esports Matches for Real Money</h1>
        <p>Join BattleZone, India's fastest-growing esports platform for PUBG Mobile and Free Fire tournaments.</p>
        {/* Content */}
      </section>
    </div>
  );
}
```

### C. Matches Page Optimization

```typescript
// app/matches/page.tsx
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata(
  'PUBG Mobile & Free Fire Matches',
  'Join live competitive matches on BattleZone. Play PUBG Mobile matches, Free Fire tournaments, and TDM matches. Enter with minimal fee, win prizes.',
  ['PUBG Mobile matches', 'Free Fire matches', 'competitive gaming', 'tournament entry fee', 'esports matches'],
  'https://battlezone.com/matches',
  'https://battlezone.com/og-matches.jpg'
);

export default function MatchesPage() {
  return (
    <div>
      <h1>Competitive PUBG Mobile & Free Fire Matches</h1>
      <p>Browse and join our latest matches with real prizes</p>
      {/* Match listing component */}
    </div>
  );
}
```

### D. Tournaments Page

```typescript
// app/tournaments/page.tsx
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata(
  'Esports Tournaments',
  'Participate in exclusive PUBG Mobile and Free Fire tournaments. Solo, duo, squad tournaments with prize pools starting from ₹10,000. Top-rated Indian esports platform.',
  ['esports tournaments', 'PUBG tournaments', 'Free Fire tournaments', 'squad tournaments', 'tournament prizes'],
  'https://battlezone.com/tournaments'
);

export default function TournamentsPage() {
  return (
    <div>
      <h1>Exclusive Esports Tournaments</h1>
      <p>Join solo, duo, and squad tournaments with real prizes</p>
      {/* Tournament listing */}
    </div>
  );
}
```

---

## 5. Content Strategy

### A. Blog Post Template with SEO

Create `app/blog/[slug]/page.tsx`:

```typescript
import { createMetadata } from '@/lib/metadata';

const blogPosts = [
  {
    slug: 'pubg-mobile-tips',
    title: '10 Pro PUBG Mobile Tips to Win More Matches',
    description: 'Master these 10 professional PUBG Mobile tips to improve your gameplay and win more competitive matches on BattleZone.',
    keywords: ['PUBG Mobile tips', 'PUBG strategies', 'competitive gaming tips'],
    content: `
      <h1>10 Pro PUBG Mobile Tips to Win More Matches</h1>
      
      <h2>1. Master Landing Strategy</h2>
      <p>The first 60 seconds of a PUBG Mobile match determine your success...</p>
      
      <h2>2. Weapon Selection for Different Ranges</h2>
      <p>Understanding weapon mechanics is crucial in competitive play...</p>
      
      <h2>3. Map Knowledge and Rotation</h2>
      <p>Pro players study the map extensively...</p>
    `,
  },
  {
    slug: 'free-fire-tournament-guide',
    title: 'Complete Free Fire Tournament Guide for Beginners',
    description: 'Learn how to prepare for Free Fire tournaments on BattleZone. Complete guide covering rules, strategies, and tips for tournament play.',
    keywords: ['Free Fire tournaments', 'tournament guide', 'Free Fire tips'],
    content: `<h1>Complete Free Fire Tournament Guide</h1>...`,
  },
];

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = blogPosts.find(p => p.slug === params.slug);
  
  return createMetadata(
    post?.title || 'Blog Post',
    post?.description || '',
    post?.keywords || [],
    `https://battlezone.com/blog/${params.slug}`
  );
}

export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = blogPosts.find(p => p.slug === params.slug);
  
  if (!post) return <div>Post not found</div>;
  
  return (
    <article>
      <h1>{post.title}</h1>
      <p className="meta">Published on {new Date().toLocaleDateString()}</p>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

### B. Blog Content Pillars

Create these high-value blog posts:

1. **Beginner Guides**
   - "How to Join Your First Esports Tournament"
   - "PUBG Mobile Complete Beginner's Guide"
   - "Free Fire Basics for Competitive Play"

2. **Strategy & Tips**
   - "10 PUBG Mobile Pro Tips"
   - "Free Fire Advanced Tactics"
   - "Team Coordination for Squad Tournaments"

3. **Platform Features**
   - "How BattleZone Fair Play System Works"
   - "Understanding KYC on BattleZone"
   - "How to Withdraw Winnings from BattleZone"

4. **Tournament Guides**
   - "Preparing for Your First Tournament"
   - "Solo vs Duo vs Squad Tournaments: Which to Choose?"
   - "Tournament Prize Distribution Explained"

5. **Game Updates & News**
   - "PUBG Mobile Latest Patch Notes & Impact on Esports"
   - "Free Fire Season Updates for Competitive Players"

---

## 6. Link Building

### A. Internal Linking Strategy

```typescript
// Create internal link map
const INTERNAL_LINKS = {
  'fair-play': { href: '/fair-play', anchor: 'Fair Play Policy' },
  'how-it-works': { href: '/how-it-works', anchor: 'How It Works' },
  'tournaments': { href: '/tournaments', anchor: 'View Tournaments' },
  'matches': { href: '/matches', anchor: 'Join Matches' },
  'blog': { href: '/blog', anchor: 'Read Our Blog' },
  'profile': { href: '/profile', anchor: 'Your Profile' },
};

// Use in components
<a href={INTERNAL_LINKS['fair-play'].href}>
  {INTERNAL_LINKS['fair-play'].anchor}
</a>
```

### B. External Backlink Opportunities

**Tier 1: High Authority Sites (Gaming & Esports)**
- Liquipedia (Add BattleZone to esports platform directory)
- esportspedia.com (Platform listing)
- Gaming industry publications
- Indian tech blogs

**Tier 2: Community & Forum Links**
- Reddit gaming communities (`r/gaming`, `r/esports`, `r/IndianGaming`)
- Gaming forums (Team Liquid, Redbull Esports forums)
- Discord gaming communities
- Facebook gaming groups

**Tier 3: Content & PR**
- Press releases on gaming news sites
- Guest posts on gaming blogs
- Sponsorship partnerships with esports teams
- Influencer collaborations

### C. Link Building Outreach Template

```
Subject: BattleZone - India's Premier Esports Platform Partnership

Hi [Editor/Blogger],

We've launched BattleZone, India's fastest-growing esports platform for competitive PUBG Mobile and Free Fire tournaments. With over [X] players and [₹Y] in monthly prize pools, we're revolutionizing esports in India.

Your audience would be interested in:
- How BattleZone ensures fair play with anti-cheat systems
- Tournament mechanics for skill-based gaming
- How Indian gamers can earn real money competitively

Would you be interested in featuring BattleZone or covering our latest tournament series?

Best regards,
[Your Name]
```

---

## 7. Monitoring & Analytics

### A. Google Search Console Setup

```typescript
// Add Google Search Console verification
// In app/layout.tsx <head>:
<meta name="google-site-verification" content="YOUR_GSC_CODE" />
```

**Actions to take:**
1. Submit sitemap.xml
2. Monitor Core Web Vitals
3. Track search queries & CTR
4. Fix indexing issues
5. Monitor mobile usability
6. Check mobile-friendly status

### B. Google Analytics 4 Setup

```typescript
// components/Analytics.tsx
import Script from 'next/script';

export function Analytics() {
  return (
    <>
      <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=GA_ID"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_ID', {
              page_path: window.location.pathname,
              page_title: document.title,
            });
          `,
        }}
      />
    </>
  );
}
```

### C. Key Metrics to Track

| Metric | Target | Tool |
|--------|--------|------|
| Organic Traffic | +200% YoY | Google Analytics |
| Keyword Rankings | Top 10 for 50+ keywords | SEMrush / Ahrefs |
| Click-Through Rate (CTR) | >4% | Google Search Console |
| Core Web Vitals | All Green | PageSpeed Insights |
| Mobile Usability | 100% | Mobile-Friendly Test |
| Domain Authority | >30 (6 months) | Ahrefs |
| Backlinks | +100/month | SEMrush |

---

## 8. Mobile & Speed Optimization

### A. Next.js Image Optimization

```typescript
import Image from 'next/image';

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes="(max-width: 640px) 100vw,
              (max-width: 1024px) 50vw,
              33vw"
      quality={80}
      loading={priority ? 'eager' : 'lazy'}
    />
  );
}
```

### B. Dynamic Imports for Code Splitting

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const TournamentBracket = dynamic(
  () => import('@/components/TournamentBracket'),
  { loading: () => <div>Loading...</div> }
);

const AdminAnalytics = dynamic(
  () => import('@/components/admin/Analytics'),
  { ssr: false, loading: () => <div>Loading analytics...</div> }
);
```

### C. next.config.js Performance

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  httpAgentOptions: {
    keepAlive: true,
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['battlezone.com', 'cdn.battlezone.com', 'cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000,
  },
  swcMinify: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
    ],
  },
};

module.exports = nextConfig;
```

### D. Performance Checklist

- [ ] PageSpeed score > 80 (mobile)
- [ ] Lighthouse score > 80
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Mobile navigation < 50ms
- [ ] Image compression to <100KB average
- [ ] CSS/JS minification enabled
- [ ] Gzip compression enabled
- [ ] Browser caching enabled (Cloudflare)

---

## 9. Structured Data & Schema

### A. Organization Schema

```typescript
// components/Schema.tsx
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BattleZone',
    url: 'https://battlezone.com',
    logo: 'https://battlezone.com/logo.png',
    description: 'India\'s premier esports gaming platform for PUBG Mobile and Free Fire tournaments.',
    foundingDate: '2024',
    foundingLocation: 'Dhanbad, Jharkhand, India',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressLocality: 'Dhanbad',
      addressRegion: 'JH',
    },
    contact: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      telephone: '+91-XXX-XXX-XXXX',
      email: 'support@battlezone.com',
    },
    sameAs: [
      'https://twitter.com/BattleZone',
      'https://facebook.com/BattleZone',
      'https://instagram.com/BattleZone',
      'https://youtube.com/@BattleZone',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### B. Product/Match Schema

```typescript
export function MatchSchema({ match }: { match: Match }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${match.gameType} - ${match.matchType}`,
    description: `Join this competitive ${match.gameType} ${match.matchType} match. Entry fee: ₹${match.entryFee}. Prize: ₹${match.prize}`,
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
      availability: 'https://schema.org/InStock',
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
    />
  );
}
```

### C. FAQ Schema

```typescript
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
          text: 'Sign up, add money to your wallet, browse available matches, and click join. You\'ll receive room details before the match starts.',
        },
      },
      {
        '@type': 'Question',
        name: 'How are match results verified?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Players upload match screenshots after completion. Our admin team verifies using EXIF data, duplicate detection, and manual review.',
        },
      },
      {
        '@type': 'Question',
        name: 'When can I withdraw my winnings?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'After KYC verification is complete, withdrawals are processed within 24-48 hours via UPI or bank transfer.',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### D. Breadcrumb Schema

```typescript
export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
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
    />
  );
}
```

---

## 10. Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Google Search Console
- [ ] Set up Google Analytics 4
- [ ] Implement root metadata in `app/layout.tsx`
- [ ] Create sitemap.xml
- [ ] Create robots.txt
- [ ] Add robots.ts metadata API
- [ ] Create web.manifest
- [ ] Add Google verification meta tag
- [ ] Test with Google Mobile-Friendly Tool
- [ ] Test with Lighthouse

### Phase 2: Page Optimization (Week 3-4)
- [ ] Homepage metadata + H1 optimization
- [ ] Matches page metadata + schema
- [ ] Tournaments page metadata + schema
- [ ] Create How It Works page with rich content
- [ ] Create Rules/Fair Play page
- [ ] Create FAQ page with FAQ schema
- [ ] Homepage internal linking strategy
- [ ] Implement breadcrumb navigation

### Phase 3: Technical SEO (Week 5-6)
- [ ] Image optimization with next/image
- [ ] Dynamic imports for code splitting
- [ ] Performance optimization (next.config.js)
- [ ] Mobile responsiveness testing
- [ ] Core Web Vitals optimization
- [ ] Canonical URLs on all pages
- [ ] Meta robots tags configured
- [ ] Submit sitemap to Search Console
- [ ] Monitor crawl stats in GSC

### Phase 4: Content (Week 7-8)
- [ ] Create 5-10 SEO blog posts
- [ ] Implement blog pagination
- [ ] Add internal links throughout blog
- [ ] Create content calendar
- [ ] Optimize existing content
- [ ] Add schema markup to blog posts
- [ ] Enable comments (with moderation)
- [ ] Create press release section

### Phase 5: Link Building & Authority (Week 9-10)
- [ ] Submit to gaming directories
- [ ] Reach out to 10+ gaming blogs for backlinks
- [ ] Post on Reddit/forums with links
- [ ] Create influencer outreach plan
- [ ] Submit press releases
- [ ] Claim business listings
- [ ] Set up social signals
- [ ] Monitor referring domains

### Phase 6: Monitoring & Optimization (Week 11+)
- [ ] Weekly Google Search Console review
- [ ] Monthly Analytics review
- [ ] Track keyword rankings
- [ ] Monitor Core Web Vitals
- [ ] Fix indexing issues
- [ ] Update old content
- [ ] A/B test meta descriptions
- [ ] Expand content strategy
- [ ] Build more backlinks
- [ ] Test new keywords

---

## 🎯 Quick Implementation Priority

**MUST DO (Week 1):**
1. Metadata in root layout
2. Sitemap + robots.txt
3. Google Search Console setup
4. Mobile-friendly testing

**SHOULD DO (Week 2-3):**
1. Page-level metadata
2. Blog content creation
3. Schema markup
4. Internal linking

**NICE TO HAVE (Week 4+):**
1. Advanced link building
2. Content calendar
3. Social media integration
4. Influencer partnerships

---

## 📊 Expected Results (Timeline)

| Month | Metric | Target |
|-------|--------|--------|
| Month 1 | Organic traffic | 50 visits/day |
| Month 2 | Organic traffic | 500 visits/day |
| Month 3 | Keyword rankings | Top 50 for 10+ keywords |
| Month 6 | Organic traffic | 5,000 visits/day |
| Month 6 | Keyword rankings | Top 10 for 20+ keywords |
| Month 12 | Organic traffic | 20,000+ visits/day |
| Month 12 | Keyword rankings | Top 5 for 10+ keywords |

---

## 🔗 Tools & Resources

**Essential Tools:**
- Google Search Console (free)
- Google Analytics (free)
- Lighthouse (built-in)
- PageSpeed Insights (free)
- Google Mobile-Friendly Test (free)
- Google Keyword Planner (free)

**Paid Tools (Optional):**
- SEMrush (keyword research, rank tracking)
- Ahrefs (backlink analysis)
- Surfer SEO (content optimization)
- SeoQuake (SERP analysis)

---

## 🚀 Final Notes

1. **SEO is long-term** - Results take 3-6 months to show significantly
2. **Content is king** - Quality blog posts drive organic traffic more than anything
3. **Mobile-first** - 90% of your users are on mobile
4. **Speed matters** - Core Web Vitals directly impact rankings
5. **Authority grows slowly** - Build quality backlinks, not quantity
6. **Monitor constantly** - Use Google Search Console daily to catch issues
7. **Update old content** - Refresh existing posts monthly
8. **User experience** - Google rewards sites with better UX

Good luck! 🎮🚀
