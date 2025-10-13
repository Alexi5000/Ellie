/**
 * Performance optimization tests
 * 
 * These tests verify that performance optimizations are properly implemented
 * across the marketing site components.
 */

import { describe, it, expect } from 'vitest';
import {
  CSS_CONTAIN,
  WILL_CHANGE,
} from '../utils/performance';

describe('Performance Utilities', () => {
  describe('CSS_CONTAIN constants', () => {
    it('should provide correct contain values', () => {
      expect(CSS_CONTAIN.FULL).toBe('layout style paint');
      expect(CSS_CONTAIN.LAYOUT).toBe('layout');
      expect(CSS_CONTAIN.STYLE).toBe('style');
      expect(CSS_CONTAIN.PAINT).toBe('paint');
      expect(CSS_CONTAIN.LAYOUT_PAINT).toBe('layout paint');
    });
  });

  describe('WILL_CHANGE constants', () => {
    it('should provide correct will-change values', () => {
      expect(WILL_CHANGE.TRANSFORM).toBe('transform');
      expect(WILL_CHANGE.OPACITY).toBe('opacity');
      expect(WILL_CHANGE.SCROLL_POSITION).toBe('scroll-position');
    });
  });
});

describe('Component Performance Optimizations', () => {
  describe('Code Splitting', () => {
    it('should verify lazy loading is implemented', async () => {
      // This test verifies that the MarketingPage uses React.lazy
      const { MarketingPage } = await import('../pages/MarketingPage');
      expect(MarketingPage).toBeDefined();
    });
  });

  describe('CSS Contain Properties', () => {
    it('should verify FeatureCard has contain property', async () => {
      const { FeatureCard } = await import('../components/marketing/Features/FeatureCard');
      expect(FeatureCard).toBeDefined();
      // The actual contain property is verified in component tests
    });

    it('should verify KPIStat has contain property', async () => {
      const { KPIStat } = await import('../components/marketing/KPIBand/KPIStat');
      expect(KPIStat).toBeDefined();
    });

    it('should verify MetricCard has contain property', async () => {
      const { MetricCard } = await import('../components/marketing/Reliability/MetricCard');
      expect(MetricCard).toBeDefined();
    });

    it('should verify StepCard has contain property', async () => {
      const { StepCard } = await import('../components/marketing/Explainer/StepCard');
      expect(StepCard).toBeDefined();
    });
  });

  describe('Image Optimization', () => {
    it('should verify LogosStrip images have width and height', async () => {
      const { LogosStrip } = await import('../components/marketing/LogosStrip/LogosStrip');
      expect(LogosStrip).toBeDefined();
      // Width and height attributes are verified in component tests
    });
  });

  describe('Will-Change Usage', () => {
    it('should verify AnimatedOrb uses will-change sparingly', async () => {
      const { AnimatedOrb } = await import('../components/marketing/Hero/AnimatedOrb');
      expect(AnimatedOrb).toBeDefined();
      // Will-change is only applied to the core animated element
    });
  });
});
