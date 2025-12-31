'use client';

import { DashboardPageHeader, DashboardSection } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/settings/theme-toggle';

export default function SettingsPage() {
  return (
    <>
      <DashboardPageHeader
        title="Settings"
        description="Manage your account preferences"
      />

      <DashboardSection>
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how Encore looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Theme
              </h4>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>
      </DashboardSection>
    </>
  );
}
