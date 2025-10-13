import React from 'react';
import { AnimatedOrb } from './AnimatedOrb';

export interface HeroProps {
  onTalkToEllie?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onTalkToEllie }) => {
  return (
    <section 
      id="hero" 
      className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
              Voice AI assistant for developers
            </h1>
            
            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl">
              Build and deploy voice AI agents in minutes. Ellie handles the complexity 
              so you can focus on creating exceptional voice experiences.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                className="px-8 py-4 bg-accent-primary text-white rounded-lg font-semibold 
                         hover:bg-accent-primary/90 transition-colors focus:outline-none 
                         focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 
                         focus:ring-offset-background-primary"
                onClick={() => window.location.href = '/signup'}
              >
                Sign up
              </button>
              
              <button
                className="px-8 py-4 bg-background-secondary text-text-primary rounded-lg 
                         font-semibold border-2 border-border-primary hover:border-accent-primary 
                         transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary 
                         focus:ring-offset-2 focus:ring-offset-background-primary"
                onClick={() => window.location.href = '/docs'}
              >
                Read the docs
              </button>
            </div>
            
            <button
              className="w-full sm:w-auto px-12 py-6 bg-accent-secondary text-white rounded-xl 
                       font-bold text-lg hover:bg-accent-secondary/90 transition-colors 
                       focus:outline-none focus:ring-2 focus:ring-accent-secondary 
                       focus:ring-offset-2 focus:ring-offset-background-primary shadow-lg"
              onClick={onTalkToEllie}
            >
              Talk to Ellie
            </button>
          </div>
          
          {/* Right Column - Animation */}
          <div className="flex items-center justify-center lg:justify-end">
            <AnimatedOrb />
          </div>
        </div>
      </div>
    </section>
  );
};
