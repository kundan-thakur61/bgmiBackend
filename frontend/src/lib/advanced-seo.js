// Advanced SEO utilities for performance and schema
export const fetchSchema = async (type, id = null) => {
  try {
    const endpoint = id ? `/api/seo/schema/${type}/${id}` : `/api/seo/schema/${type}`;
    const response = await fetch(endpoint);
    const data = await response.json();
    return data.schema || data.schemas;
  } catch (error) {
    console.error('Error fetching schema:', error);
    return null;
  }
};

// Web Vitals monitoring for Core Web Vitals
export const reportWebVitals = (metric) => {
  const { name, value, id } = metric;
  
  // Send to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      event_label: id,
      non_interaction: true,
    });
  }
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${name}:`, value);
  }
};

// Preload critical resources
export const preloadResources = () => {
  if (typeof window === 'undefined') return;
  
  const resources = [
    { href: '/fonts/main.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
    { href: '/images/logo.webp', as: 'image' }
  ];
  
  resources.forEach(({ href, as, type, crossOrigin }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    if (crossOrigin) link.crossOrigin = crossOrigin;
    document.head.appendChild(link);
  });
};

// Generate hreflang tags for multilingual support
export const generateHreflangTags = (currentPath, languages = ['en', 'hi']) => {
  return languages.map(lang => ({
    lang,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/${lang}${currentPath}`
  }));
};

// Optimize images for mobile-first
export const getOptimizedImageProps = (src, alt, priority = false) => ({
  src,
  alt,
  loading: priority ? 'eager' : 'lazy',
  sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality: 85,
  priority
});

// Crawl budget optimization - check if bot
export const isCrawlerBot = (userAgent) => {
  const bots = ['googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot'];
  return bots.some(bot => userAgent.toLowerCase().includes(bot));
};
