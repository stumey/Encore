'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface ThemeOption {
  value: 'light' | 'dark' | 'system';
  label: string;
  description: string;
  icon: React.ReactNode;
}

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    description: 'Use light theme',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Use dark theme',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    ),
  },
  {
    value: 'system',
    label: 'System',
    description: 'Match system preference',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-3">
        {themeOptions.map((option) => (
          <div
            key={option.value}
            className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 animate-pulse"
          >
            <div className="h-5 w-5 bg-gray-300 dark:bg-slate-600 rounded" />
            <div className="flex-1">
              <div className="h-4 w-16 bg-gray-300 dark:bg-slate-600 rounded mb-1" />
              <div className="h-3 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {themeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          className={`
            w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200
            ${
              theme === option.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-900'
                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-600'
            }
          `}
        >
          <span
            className={`
              flex-shrink-0 p-2 rounded-lg
              ${
                theme === option.value
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'
              }
            `}
          >
            {option.icon}
          </span>
          <div className="flex-1 text-left">
            <p
              className={`font-medium ${
                theme === option.value
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {option.label}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {option.description}
            </p>
          </div>
          {theme === option.value && (
            <svg
              className="h-5 w-5 text-primary-600 dark:text-primary-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}
