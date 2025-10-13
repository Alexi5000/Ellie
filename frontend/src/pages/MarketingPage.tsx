import React, { lazy, Suspense } from 'react';
import { Header } from '../components/marketing/Header';
import { Hero } from '../components/marketing/Hero';
import { CodeTabs } from '../components/marketing/CodeTabs';
import { startCallSnippets } from '../components/marketing/CodeTabs/codeSnippets';

// Lazy load below-the-fold components for better performance
const LogosStrip = lazy(() => import('../components/marketing/LogosStrip').then(m => ({ default: m.LogosStrip })));
const KPIBand = lazy(() => import('../components/marketing/KPIBand').then(m => ({ default: m.KPIBand })));
const Solutions = lazy(() => import('../components/marketing/Solutions').then(m => ({ default: m.Solutions })));
const Explainer = lazy(() => import('../components/marketing/Explainer').then(m => ({ default: m.Explainer })));
const Features = lazy(() => import('../components/marketing/Features').then(m => ({ default: m.Features })));
const Reliability = lazy(() => import('../components/marketing/Reliability').then(m => ({ default: m.Reliability })));
const Footer = lazy(() => import('../components/marketing/Footer').then(m => ({ default: m.Footer })));

// Loading fallback component
const SectionLoader: React.FC = () => (
  <div className="flex items-center justify-center py-16">
    <div className="animate-pulse text-text-secondary">Loading...</div>
  </div>
);

export const MarketingPage: React.FC = () => {
  const handleTalkToEllie = () => {
    // TODO: Implement voice interaction demo
    console.log('Talk to Ellie clicked');
  };

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-primary focus:text-white 
                 focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
      >
        Skip to main content
      </a>

      {/* Header - Always visible */}
      <Header />

      {/* Main content */}
      <main id="main-content">
        {/* Hero Section - Above the fold */}
        <Hero onTalkToEllie={handleTalkToEllie} />

        {/* Code Examples Section - Above the fold */}
        <section id="code-examples" className="py-16 px-4 sm:px-6 lg:px-8 bg-background-secondary">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
                Start building in minutes
              </h2>
              <p className="text-lg text-text-secondary">
                Choose your language and get started with our simple API
              </p>
            </div>
            <CodeTabs tabs={startCallSnippets} />
          </div>
        </section>

        {/* Below-the-fold sections with lazy loading */}
        <Suspense fallback={<SectionLoader />}>
          {/* Logos Strip Section */}
          <section id="trusted-by" className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-text-primary text-center mb-12">
                Trusted by developers worldwide
              </h2>
              <LogosStrip />
            </div>
          </section>
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          {/* KPI Statistics Section */}
          <section id="stats" className="py-16 px-4 sm:px-6 lg:px-8 bg-background-secondary">
            <div className="max-w-7xl mx-auto">
              <KPIBand />
            </div>
          </section>
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          {/* Solutions Section */}
          <section id="solutions" className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
                  Solutions for every use case
                </h2>
                <p className="text-lg text-text-secondary">
                  Whether you're handling inbound calls or making outbound connections
                </p>
              </div>
              <Solutions />
            </div>
          </section>
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          {/* Explainer Section */}
          <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-background-secondary">
            <div className="max-w-7xl mx-auto">
              <Explainer />
            </div>
          </section>
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          {/* Features Section */}
          <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
                  Everything you need to build voice AI
                </h2>
                <p className="text-lg text-text-secondary">
                  Powerful features that scale with your needs
                </p>
              </div>
              <Features />
            </div>
          </section>
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          {/* Reliability Section */}
          <section id="reliability" className="py-20 px-4 sm:px-6 lg:px-8 bg-background-secondary">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
                  Built for reliability and compliance
                </h2>
                <p className="text-lg text-text-secondary">
                  Enterprise-grade infrastructure you can trust
                </p>
              </div>
              <Reliability />
            </div>
          </section>
        </Suspense>
      </main>

      {/* Footer */}
      <Suspense fallback={<SectionLoader />}>
        <Footer />
      </Suspense>
    </div>
  );
};
