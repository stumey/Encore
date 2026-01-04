'use client';

import { ReactNode, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NavbarProps } from './navbar';
import { Sidebar, SidebarItem } from './sidebar';
import { Avatar } from '../ui/avatar';
import { Dropdown, DropdownItem, DropdownDivider, DropdownLabel } from '../ui/dropdown';

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
  const { logoHref = '/dashboard', user, onLogout } = navbarProps;

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-slate-900 ${className}`}>
      {/* Header - aligned with sidebar + content */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 h-16 flex">
        {/* Logo section - matches sidebar width */}
        <div
          className={`flex items-center justify-start px-4 border-r border-gray-200 dark:border-slate-700 transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <Link href={logoHref} className="flex items-center gap-1">
            <Image
              src="/logo-icon.png"
              alt="Encore"
              width={48}
              height={48}
              className="h-12 w-12 flex-shrink-0 -ml-2"
            />
            {!sidebarCollapsed && (
              <span className="text-xl font-bold text-gray-900 dark:text-white -ml-1">
                encore
              </span>
            )}
          </Link>
        </div>

        {/* Right section - fills remaining space */}
        <div className="flex-1 flex items-center justify-end px-4 sm:px-6 lg:px-8">
          {user && (
            <Dropdown
              align="right"
              trigger={
                <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <Avatar src={user.avatar} name={user.name} size="md" />
                </button>
              }
            >
              <DropdownLabel>Account</DropdownLabel>
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              <DropdownDivider />
              <DropdownItem
                href="/settings"
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              >
                Profile
              </DropdownItem>
              <DropdownItem
                href="/settings"
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              >
                Settings
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem
                onClick={onLogout}
                danger
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                }
              >
                Logout
              </DropdownItem>
            </Dropdown>
          )}
        </div>
      </header>

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
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
