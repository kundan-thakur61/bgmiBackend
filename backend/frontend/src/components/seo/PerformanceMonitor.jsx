'use client';

import { useEffect } from 'react';

export default function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Report Web Vitals to analytics
      const reportWebVitals = (metric) => {
        if (window.gtag) {
          window.gtag('event', metric.name, {
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            event_category: 'Web Vitals',
            event_label: metric.id,
            non_interaction: true,
          });
        }
      };

      // Observe performance
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              reportWebVitals({
                name: entry.name,
                value: entry.value || entry.duration,
                id: entry.entryType,
              });
            }
          });
          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        } catch (e) {
          console.error('Performance monitoring error:', e);
        }
      }
    }
  }, []);

  return null;
}
