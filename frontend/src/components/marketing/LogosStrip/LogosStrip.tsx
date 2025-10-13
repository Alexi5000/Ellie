import React from 'react';
import { useTheme } from '../../../hooks/useTheme';

export interface Logo {
  name: string;
  src: string;
  srcDark?: string;
  alt: string;
  width: number;
  height: number;
}

export interface LogosStripProps {
  logos: Logo[];
  className?: string;
}

export const LogosStrip: React.FC<LogosStripProps> = ({ logos, className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`w-full py-12 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {logos.map((logo) => {
            const logoSrc = isDark && logo.srcDark ? logo.srcDark : logo.src;
            
            return (
              <div
                key={logo.name}
                className="flex items-center justify-center transition-all duration-300 hover:scale-110 hover:opacity-80"
              >
                <img
                  src={logoSrc}
                  alt={logo.alt}
                  width={logo.width}
                  height={logo.height}
                  className="max-w-full h-auto object-contain"
                  style={{
                    maxHeight: '48px',
                    width: 'auto',
                  }}
                  loading="lazy"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
