'use client';

import { ReactNode } from 'react';
import { AnimatedCounter } from '@/components/ui';

export interface StatCardProps {
  /** The stat label */
  label: string;
  /** The numeric value to display */
  value: number;
  /** Icon to display */
  icon: ReactNode;
  /** Gradient colors for the icon background */
  gradient: 'purple' | 'blue' | 'green' | 'orange';
  /** Animation delay in milliseconds */
  animationDelay?: number;
  /** Optional trend indicator */
  trend?: {
    value: number;
    label: string;
  };
}

const gradientStyles = {
  purple: 'from-primary-500 to-primary-600 shadow-primary-500/30',
  blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
  green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
  orange: 'from-orange-500 to-orange-600 shadow-orange-500/30',
};

/**
 * Stat Card Component
 *
 * Displays a single statistic with:
 * - Centered layout with gradient icon
 * - Animated number counter
 * - Optional trend indicator
 * - Hover lift effect
 */
export function StatCard({
  label,
  value,
  icon,
  gradient,
  animationDelay = 0,
  trend,
}: StatCardProps) {
  return (
    <div
      className="opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-default">
        <div className="flex flex-col items-center text-center">
          {/* Gradient Icon Container */}
          <div
            className={`w-14 h-14 mb-4 bg-gradient-to-br ${gradientStyles[gradient]} rounded-2xl flex items-center justify-center shadow-lg`}
          >
            <div className="text-white">{icon}</div>
          </div>

          {/* Animated Number */}
          <AnimatedCounter
            value={value}
            duration={1200}
            delay={animationDelay + 200}
            className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white"
          />

          {/* Label */}
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
            {label}
          </p>

          {/* Optional Trend Indicator */}
          {trend && trend.value !== 0 && (
            <p
              className={`text-xs mt-2 flex items-center gap-1 ${
                trend.value > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {trend.value > 0 ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {Math.abs(trend.value)} {trend.label}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
