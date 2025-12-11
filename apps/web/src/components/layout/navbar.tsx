'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { Avatar } from '../ui/avatar';
import { Dropdown, DropdownItem, DropdownDivider, DropdownLabel } from '../ui/dropdown';
import { Button } from '../ui/button';

export interface NavbarProps {
  logo?: ReactNode;
  logoHref?: string;
  navLinks?: NavLink[];
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogout?: () => void;
  actions?: ReactNode;
  className?: string;
}

export interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

export function Navbar({
  logo,
  logoHref = '/',
  navLinks = [],
  user,
  onLogout,
  actions,
  className = '',
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={logoHref} className="flex items-center">
              {logo || (
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  Encore
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-8">
            {navLinks.length > 0 && (
              <div className="flex gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${
                      link.active
                        ? 'text-purple-600'
                        : 'text-gray-700 hover:text-purple-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {actions && <div className="flex items-center gap-4">{actions}</div>}

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
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <DropdownDivider />
                <DropdownItem
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                >
                  Profile
                </DropdownItem>
                <DropdownItem
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

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-purple-600 transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                  link.active
                    ? 'bg-purple-50 text-purple-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar src={user.avatar} name={user.name} size="md" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => {
                    onLogout?.();
                    setMobileMenuOpen(false);
                  }}
                >
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
