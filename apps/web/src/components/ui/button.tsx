'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Spinner } from './spinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'group inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

    const variantStyles = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md hover:shadow-primary-500/25 focus:ring-primary-500 shadow-sm',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 hover:shadow-md focus:ring-gray-500 shadow-sm dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600',
      outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 hover:shadow-md hover:shadow-primary-500/10 focus:ring-primary-500 dark:hover:bg-primary-950',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-slate-800',
      danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md hover:shadow-red-500/25 focus:ring-red-500 shadow-sm',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner size={size === 'sm' ? 'sm' : 'md'} />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
