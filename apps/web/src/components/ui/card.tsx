'use client';

import { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  noPadding?: boolean;
}

export function Card({ children, className = '', noPadding = false, ...props }: CardProps) {
  const paddingStyle = noPadding ? '' : 'p-6';

  return (
    <div
      className={`bg-white rounded-lg shadow-md border border-gray-200 ${paddingStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  actions?: ReactNode;
}

export function CardHeader({ children, actions, className = '', ...props }: CardHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between pb-4 border-b border-gray-200 ${className}`}
      {...props}
    >
      <div className="flex-1">{children}</div>
      {actions && <div className="ml-4">{actions}</div>}
    </div>
  );
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function CardTitle({ children, className = '', ...props }: CardTitleProps) {
  return (
    <h3
      className={`text-lg font-semibold text-gray-900 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function CardDescription({ children, className = '', ...props }: CardDescriptionProps) {
  return (
    <p
      className={`text-sm text-gray-500 mt-1 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({ children, className = '', ...props }: CardContentProps) {
  return (
    <div className={`py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardFooter({ children, className = '', ...props }: CardFooterProps) {
  return (
    <div
      className={`pt-4 border-t border-gray-200 flex items-center gap-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
