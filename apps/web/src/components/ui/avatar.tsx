'use client';

import { ImgHTMLAttributes, useState } from 'react';

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  name?: string;
}

export function Avatar({
  size = 'md',
  src,
  alt = '',
  fallback,
  name,
  className = '',
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const sizeStyles = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = name ? getInitials(name) : fallback || '?';
  const shouldShowImage = src && !imageError;

  return (
    <div
      className={`${sizeStyles[size]} relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-semibold overflow-hidden ${className}`}
    >
      {shouldShowImage ? (
        <>
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className={`h-full w-full object-cover transition-opacity duration-200 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
            {...props}
          />
          {!imageLoaded && (
            <span className="absolute inset-0 flex items-center justify-center">
              {initials}
            </span>
          )}
        </>
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
