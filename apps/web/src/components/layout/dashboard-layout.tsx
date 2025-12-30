'use client';

import { ReactNode, useState } from 'react';
import { Navbar, NavbarProps } from './navbar';
import { Sidebar, SidebarItem } from './sidebar';

export interface DashboardLayoutProps {
  children: ReactNode;
  navbarProps: NavbarProps;
  sidebarItems: SidebarItem[];
  className?: string;
}

export function DashboardLayout({
  children,
  navbarProps,
  sidebarItems,
  className = '',
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Navbar */}
      <Navbar {...navbarProps} />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <Sidebar
          items={sidebarItems}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function DashboardPageHeader({
  title,
  description,
  actions,
  className = '',
}: DashboardPageHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-gray-600">{description}</p>
          )}
        </div>
        {actions && <div className="ml-4">{actions}</div>}
      </div>
    </div>
  );
}

export interface DashboardSectionProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DashboardSection({
  title,
  description,
  actions,
  children,
  className = '',
}: DashboardSectionProps) {
  return (
    <section className={`mb-8 ${className}`}>
      {(title || description || actions) && (
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div>
              {title && (
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-gray-600">{description}</p>
              )}
            </div>
            {actions && <div className="ml-4">{actions}</div>}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}
