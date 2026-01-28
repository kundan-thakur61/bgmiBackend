'use client';

import Script from 'next/script';

export function GoogleAnalytics({ gaId }) {
  if (!gaId) return null;

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

export function GoogleSearchConsole({ verificationCode }) {
  if (!verificationCode) return null;
  
  return (
    <meta
      name="google-site-verification"
      content={verificationCode}
    />
  );
}
