import { useEffect } from 'react';
import { reportWebVitals } from '../utils/performance';

/**
 * PerformanceMonitor component
 * 
 * Monitors and reports Web Vitals metrics for performance tracking.
 * Should be included once at the app root level.
 * 
 * Tracks:
 * - CLS (Cumulative Layout Shift) - target < 0.1
 * - FID (First Input Delay) - target < 100ms
 * - LCP (Largest Contentful Paint) - target < 2.5s
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 */
export const PerformanceMonitor: React.FC = () => {
  useEffect(() => {
    // Only monitor in browser environment
    if (typeof window === 'undefined') return;

    // Use web-vitals library if available
    const loadWebVitals = async () => {
      try {
        const { onCLS, onFID, onLCP, onFCP, onTTFB } = await import('web-vitals');
        
        onCLS(reportWebVitals);
        onFID(reportWebVitals);
        onLCP(reportWebVitals);
        onFCP(reportWebVitals);
        onTTFB(reportWebVitals);
      } catch (error) {
        // web-vitals not installed, use Performance API fallback
        if ('performance' in window && 'PerformanceObserver' in window) {
          try {
            // Observe Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              reportWebVitals({
                name: 'LCP',
                value: lastEntry.startTime,
                id: `lcp-${Date.now()}`,
              });
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // Observe First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              entries.forEach((entry: any) => {
                reportWebVitals({
                  name: 'FID',
                  value: entry.processingStart - entry.startTime,
                  id: `fid-${Date.now()}`,
                });
              });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });

            // Observe Cumulative Layout Shift
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              entries.forEach((entry: any) => {
                if (!entry.hadRecentInput) {
                  clsValue += entry.value;
                }
              });
              reportWebVitals({
                name: 'CLS',
                value: clsValue,
                id: `cls-${Date.now()}`,
              });
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
          } catch (error) {
            console.warn('Performance monitoring failed:', error);
          }
        }
      }
    };

    loadWebVitals();
  }, []);

  // This component doesn't render anything
  return null;
};
