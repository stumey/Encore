'use client';

import { ReactNode } from 'react';
import { Button } from './button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  actions?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  actions,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 ${className}`}
    >
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-gray-500 max-w-md mb-6">
          {description}
        </p>
      )}

      {actions ? (
        <div className="flex items-center gap-4">
          {actions}
        </div>
      ) : (action || secondaryAction) && (
        <div className="flex items-center gap-4">
          {action && (
            <Button onClick={action.onClick} variant="primary">
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function EmptyStateIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-16 w-16 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );
}
