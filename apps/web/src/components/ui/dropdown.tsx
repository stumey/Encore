'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({
  trigger,
  children,
  align = 'right',
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const alignmentStyles = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute ${alignmentStyles} mt-2 w-56 rounded-lg bg-white shadow-lg border border-gray-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DropdownItem({
  children,
  onClick,
  icon,
  danger = false,
  disabled = false,
  className = '',
}: DropdownItemProps) {
  const baseStyles = 'flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors';
  const stateStyles = disabled
    ? 'text-gray-400 cursor-not-allowed'
    : danger
    ? 'text-red-600 hover:bg-red-50 cursor-pointer'
    : 'text-gray-700 hover:bg-gray-100 cursor-pointer';

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${baseStyles} ${stateStyles} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-gray-200" />;
}

export interface DropdownLabelProps {
  children: ReactNode;
  className?: string;
}

export function DropdownLabel({ children, className = '' }: DropdownLabelProps) {
  return (
    <div className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase ${className}`}>
      {children}
    </div>
  );
}
