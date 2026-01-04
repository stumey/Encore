'use client';

import { useEffect, useRef, useState } from 'react';

export interface AnimatedCounterProps {
  /** The target value to count to */
  value: number;
  /** Duration of the animation in milliseconds */
  duration?: number;
  /** Delay before starting the animation in milliseconds */
  delay?: number;
  /** Optional className for styling */
  className?: string;
  /** Format function for the displayed number */
  formatValue?: (value: number) => string;
}

/**
 * Animated counter that smoothly counts up to a target value
 *
 * Uses requestAnimationFrame for smooth, GPU-friendly animation.
 * Implements easeOutExpo for a satisfying deceleration effect.
 */
export function AnimatedCounter({
  value,
  duration = 1000,
  delay = 0,
  className = '',
  formatValue = (v) => Math.round(v).toLocaleString(),
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Don't animate if value is 0
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    const startAnimation = () => {
      const animate = (currentTime: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = currentTime;
        }

        const elapsed = currentTime - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);

        // easeOutExpo for satisfying deceleration
        const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

        setDisplayValue(easeOutExpo * value);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    };

    // Handle delay
    const timeoutId = setTimeout(startAnimation, delay);

    return () => {
      clearTimeout(timeoutId);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      startTimeRef.current = null;
    };
  }, [value, duration, delay]);

  return <span className={className}>{formatValue(displayValue)}</span>;
}
