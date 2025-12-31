'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardPageHeader, DashboardSection } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { ThemeToggle } from '@/components/settings/theme-toggle';
import { useCurrentUser, useUpdateProfile, useUserStats } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const FREE_PHOTO_LIMIT = 25;

export default function ProfilePage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: stats } = useUserStats();
  const updateProfile = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
  });

  // Initialize form when user loads
  const handleEditStart = () => {
    setFormData({
      displayName: user?.displayName || '',
      username: user?.username || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // TODO: Get from subscription status when implemented
  const isPremium = false;
  const currentPhotoCount = stats?.totalMedia ?? 0;

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <DashboardPageHeader
        title="Profile"
        description="Manage your profile and account settings"
      />

      {/* Profile Section */}
      <DashboardSection title="Your Profile" description="How others see you on Encore">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <Avatar
                src={user?.avatarUrl || undefined}
                name={user?.displayName || user?.username || user?.email || 'User'}
                size="xl"
              />

              {/* Profile Info */}
              {isEditing ? (
                <div className="flex-1 space-y-4">
                  <TextInput
                    label="Display Name"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Your display name"
                    fullWidth
                  />
                  <TextInput
                    label="Username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="your-username"
                    fullWidth
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      loading={updateProfile.isPending}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                      disabled={updateProfile.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {user?.displayName || user?.username || 'No name set'}
                  </h3>
                  {user?.username && user?.displayName && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{user.username}
                    </p>
                  )}
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {user?.email}
                  </p>

                  {/* Stats Summary */}
                  <div className="flex gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats?.totalConcerts || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Concerts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats?.uniqueArtists || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Artists</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats?.totalMedia || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Photos</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditStart}
                    className="mt-4"
                  >
                    Edit Profile
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </DashboardSection>

      {/* Subscription Section */}
      <DashboardSection title="Subscription" description="Manage your plan and usage">
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Current Plan */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {isPremium ? 'Premium' : 'Free Plan'}
                  </h4>
                  <Badge variant={isPremium ? 'success' : 'default'}>
                    {isPremium ? 'Active' : 'Current'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {isPremium
                    ? 'Unlimited photo uploads, priority AI processing'
                    : `${FREE_PHOTO_LIMIT} photos per month, basic AI analysis`
                  }
                </p>
              </div>
              {!isPremium && (
                <Link href="/pricing">
                  <Button>Upgrade to Premium</Button>
                </Link>
              )}
            </div>

            {/* Usage */}
            {!isPremium && (
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Photo usage</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {currentPhotoCount} / {FREE_PHOTO_LIMIT}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      currentPhotoCount >= FREE_PHOTO_LIMIT
                        ? 'bg-red-500'
                        : currentPhotoCount >= FREE_PHOTO_LIMIT * 0.8
                          ? 'bg-yellow-500'
                          : 'bg-primary-600'
                    }`}
                    style={{ width: `${Math.min((currentPhotoCount / FREE_PHOTO_LIMIT) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </DashboardSection>

      {/* Appearance Section */}
      <DashboardSection title="Appearance" description="Customize how Encore looks">
        <Card>
          <CardContent className="pt-6">
            <div className="max-w-md">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Theme
              </h4>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>
      </DashboardSection>

      {/* Account Section */}
      <DashboardSection title="Account" description="Account settings and actions">
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Email */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Email Address</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>

            {/* Sign Out */}
            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
              <Button
                variant="danger"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardSection>
    </>
  );
}
