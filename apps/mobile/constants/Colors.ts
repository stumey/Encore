export const Colors = {
  light: {
    primary: '#7c3aed', // purple-600
    primaryDark: '#6d28d9', // purple-700
    primaryLight: '#8b5cf6', // purple-500
    background: '#ffffff',
    card: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  dark: {
    primary: '#8b5cf6', // purple-500
    primaryDark: '#7c3aed', // purple-600
    primaryLight: '#a78bfa', // purple-400
    background: '#111827',
    card: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    border: '#374151',
    error: '#f87171',
    success: '#34d399',
    warning: '#fbbf24',
    info: '#60a5fa',
  },
};

export type ColorScheme = keyof typeof Colors;
