'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

export interface SidebarProps {
  items: SidebarItem[];
  className?: string;
  collapsed?: boolean;
}

export interface SidebarItem {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
  items?: SidebarSubItem[];
}

export interface SidebarSubItem {
  label: string;
  href: string;
}

export function Sidebar({ items, className = '', collapsed = false }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } ${className}`}
    >
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = isActive(item.href);
          const hasSubItems = item.items && item.items.length > 0;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    active
                      ? 'bg-purple-50 text-purple-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-purple-600'
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                {item.icon && (
                  <span className="flex-shrink-0 h-5 w-5">{item.icon}</span>
                )}
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-600">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>

              {/* Sub-items */}
              {hasSubItems && !collapsed && active && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.items!.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={`
                        block px-3 py-1.5 rounded-lg text-sm transition-colors
                        ${
                          pathname === subItem.href
                            ? 'text-purple-600 font-medium'
                            : 'text-gray-600 hover:text-purple-600'
                        }
                      `}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export function SidebarIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}
