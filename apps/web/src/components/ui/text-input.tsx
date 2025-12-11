'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      className = '',
      label,
      error,
      helperText,
      fullWidth = false,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = !!error;

    const baseStyles = 'px-4 py-2 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50';

    const stateStyles = hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500';

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${baseStyles} ${stateStyles} ${widthStyle} ${className}`}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';

export { TextInput };
