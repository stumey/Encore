'use client';

import { ReactNode, createContext, useContext, useState } from 'react';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component');
  }
  return context;
}

export interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  defaultValue,
  children,
  className = '',
  onValueChange,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onValueChange?.(value);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1 gap-1 ${className}`}
      role="tablist"
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TabsTrigger({
  value,
  children,
  className = '',
  disabled = false,
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
      className={`
        inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${
          isActive
            ? 'bg-white text-purple-600 shadow-sm'
            : 'text-gray-700 hover:bg-white/50'
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className = '' }: TabsContentProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      className={`mt-4 focus:outline-none ${className}`}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
