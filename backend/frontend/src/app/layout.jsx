import '@/styles/globals.css';
import { generateMetadata } from '@/lib/seo';
import { localBusinessSchema, videoGameSchema } from '@/lib/local-seo-schema';
import { OrganizationSchema, WebApplicationSchema, GoogleAnalytics } from '@/components/seo';
import { AuthProvider } from '@/context/AuthContext';
import PerformanceMonitor from '@/components/seo/PerformanceMonitor';

export const metadata = generateMetadata({});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="msapplication-TileColor" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BattleZone" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="BattleZone" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href="https://battlezone.com" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoGameSchema) }} />
        <OrganizationSchema />
        <WebApplicationSchema />
      </head>
      <body className="min-h-screen bg-dark-900 text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
        <PerformanceMonitor />
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
