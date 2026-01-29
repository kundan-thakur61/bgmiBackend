'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';

export default function WebVitalsMonitor() {
  useReportWebVitals((metric) => {
    const { name, value, rating, id } = metric;
    
    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', name, {
        event_category: 'Web Vitals',
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        event_label: id,
        rating,
        non_interaction: true,
      });
    }
    
    // Log performance issues
    if (rating === 'poor') {
      console.warn(`⚠️ Poor ${name}: ${value}`);
    }
  });
  
  return null;
}
