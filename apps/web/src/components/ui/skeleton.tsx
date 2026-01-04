import { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Width of the skeleton. Can be Tailwind class or CSS value */
  width?: string;
  /** Height of the skeleton. Can be Tailwind class or CSS value */
  height?: string;
  /** Shape variant */
  variant?: 'rectangular' | 'circular' | 'text';
}

/**
 * Skeleton loading placeholder component
 *
 * Uses CSS-only animation (GPU-accelerated) for zero performance impact.
 * The pulse animation runs on the compositor thread.
 */
export function Skeleton({
  width,
  height,
  variant = 'rectangular',
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded',
  };

  // Handle width/height - check if it's a Tailwind class or CSS value
  const isWidthClass = width?.startsWith('w-');
  const isHeightClass = height?.startsWith('h-');

  const sizeClasses = [
    isWidthClass ? width : '',
    isHeightClass ? height : '',
  ].filter(Boolean).join(' ');

  const inlineStyles = {
    ...style,
    ...(width && !isWidthClass ? { width } : {}),
    ...(height && !isHeightClass ? { height } : {}),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses} ${className}`}
      style={Object.keys(inlineStyles).length > 0 ? inlineStyles : undefined}
      {...props}
    />
  );
}

/**
 * Pre-built skeleton for stat cards
 */
export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex flex-col items-center text-center">
        {/* Icon placeholder */}
        <Skeleton variant="circular" className="w-14 h-14 mb-4" />
        {/* Number placeholder */}
        <Skeleton className="w-16 h-12 mb-2" />
        {/* Label placeholder */}
        <Skeleton variant="text" className="w-24 h-4" />
      </div>
    </div>
  );
}

/**
 * Pre-built skeleton for concert list items
 */
export function ConcertCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-16 h-5 rounded-full" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton variant="text" className="w-28 h-4" />
            <Skeleton variant="text" className="w-36 h-4" />
          </div>
        </div>
        <Skeleton className="w-16 h-8 rounded-md" />
      </div>
    </div>
  );
}
