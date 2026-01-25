// Core Web Vitals Monitoring
const trackWebVitals = () => {
  if ('web-vital' in window) return;
  
  const vitals = {};
  
  // LCP - Largest Contentful Paint
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    vitals.lcp = entries[entries.length - 1].renderTime || entries[entries.length - 1].loadTime;
    sendMetric('LCP', vitals.lcp);
  }).observe({ entryTypes: ['largest-contentful-paint'] });
  
  // FID - First Input Delay
  new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      vitals.fid = entry.processingStart - entry.startTime;
      sendMetric('FID', vitals.fid);
    });
  }).observe({ entryTypes: ['first-input'] });
  
  // CLS - Cumulative Layout Shift
  let cls = 0;
  new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (!entry.hadRecentInput) cls += entry.value;
    });
    vitals.cls = cls;
    sendMetric('CLS', cls);
  }).observe({ entryTypes: ['layout-shift'] });
};

// Keyword Rankings Monitor
const trackKeywords = async () => {
  const keywords = ['BGMI tournaments', 'mobile esports India', 'Free Fire competitive'];
  const rankings = {};
  
  for (const kw of keywords) {
    rankings[kw] = {
      position: await checkRanking(kw),
      timestamp: Date.now()
    };
  }
  
  sendMetric('keywords', rankings);
};

const checkRanking = async (keyword) => {
  // Placeholder - integrate with SEO API
  return fetch(`/api/seo/rank?keyword=${encodeURIComponent(keyword)}`)
    .then(r => r.json())
    .catch(() => ({ position: null }));
};

// User Behavior Analytics
const trackUserBehavior = () => {
  const behavior = {
    pageViews: 0,
    clicks: 0,
    scrollDepth: 0,
    timeOnPage: Date.now()
  };
  
  // Page views
  behavior.pageViews++;
  
  // Click tracking
  document.addEventListener('click', (e) => {
    behavior.clicks++;
    sendMetric('click', { target: e.target.tagName, time: Date.now() });
  });
  
  // Scroll depth
  window.addEventListener('scroll', () => {
    const depth = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    behavior.scrollDepth = Math.max(behavior.scrollDepth, depth);
  });
  
  // Time on page
  window.addEventListener('beforeunload', () => {
    sendMetric('session', {
      duration: Date.now() - behavior.timeOnPage,
      scrollDepth: behavior.scrollDepth,
      clicks: behavior.clicks
    });
  });
};

// Send metrics to analytics endpoint
const sendMetric = (name, value) => {
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', JSON.stringify({ name, value, timestamp: Date.now() }));
  } else {
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({ name, value, timestamp: Date.now() }),
      keepalive: true
    });
  }
};

// Initialize monitoring
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    trackWebVitals();
    trackUserBehavior();
    trackKeywords();
  });
} else {
  trackWebVitals();
  trackUserBehavior();
  trackKeywords();
}
