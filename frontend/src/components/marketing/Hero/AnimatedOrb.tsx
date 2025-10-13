import { motion } from 'framer-motion';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { useEffect, useState } from 'react';

interface AnimatedOrbProps {
  isActive?: boolean;
  className?: string;
}

/**
 * AnimatedOrb component with mic-reactive visual feedback
 * 
 * Features:
 * - Framer Motion spring animations
 * - Mic-reactive visual feedback
 * - Respects prefers-reduced-motion
 * - Performance optimized with CSS properties
 */
export const AnimatedOrb: React.FC<AnimatedOrbProps> = ({ 
  isActive = false,
  className = '' 
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [pulseScale, setPulseScale] = useState(1);

  // Simulate mic-reactive feedback with random pulses when active
  useEffect(() => {
    if (!isActive || prefersReducedMotion) {
      setPulseScale(1);
      return;
    }

    const interval = setInterval(() => {
      // Random pulse between 1.0 and 1.15
      const randomScale = 1 + Math.random() * 0.15;
      setPulseScale(randomScale);
    }, 150);

    return () => clearInterval(interval);
  }, [isActive, prefersReducedMotion]);

  // Static version for reduced motion
  if (prefersReducedMotion) {
    return (
      <div 
        className={`relative w-64 h-64 ${className}`}
        style={{ contain: 'layout style paint' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-32 h-32 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary opacity-80"
            aria-label="Voice assistant orb"
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-64 h-64 ${className}`}
      style={{ contain: 'layout style paint' }}
      aria-label="Animated voice assistant orb"
    >
      {/* Outer glow rings */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: isActive ? [1, 1.2, 1] : 1,
          opacity: isActive ? [0.3, 0.5, 0.3] : 0.2,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-48 h-48 rounded-full bg-accent-primary blur-xl" />
      </motion.div>

      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: isActive ? [1, 1.15, 1] : 1,
          opacity: isActive ? [0.4, 0.6, 0.4] : 0.3,
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      >
        <div className="w-40 h-40 rounded-full bg-accent-secondary blur-lg" />
      </motion.div>

      {/* Core orb with mic-reactive scaling */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: pulseScale,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
        style={{ willChange: 'transform' }}
      >
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary shadow-2xl" />
      </motion.div>

      {/* Inner highlight */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={{
          opacity: isActive ? [0.6, 0.9, 0.6] : 0.4,
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-20 h-20 rounded-full bg-white blur-md" />
      </motion.div>

      {/* Particle effects when active */}
      {isActive && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                scale: [0, 1.5],
                opacity: [0.8, 0],
                rotate: i * 60,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: i * 0.2,
              }}
            >
              <div className="w-2 h-2 rounded-full bg-accent-primary" />
            </motion.div>
          ))}
        </>
      )}
    </div>
  );
};
