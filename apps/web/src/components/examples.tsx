'use client';

/**
 * Component Examples and Usage Guide
 *
 * This file demonstrates how to use all the UI and layout components
 * built for the Encore Next.js web app.
 */

import { useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Dropdown,
  DropdownItem,
  DropdownDivider,
  DropdownLabel,
  EmptyState,
  EmptyStateIcon,
  Modal,
  ModalFooter,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TextInput,
} from './ui';

import {
  DashboardLayout,
  DashboardPageHeader,
  DashboardSection,
} from './layout';

/**
 * Button Examples
 */
export function ButtonExamples() {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Buttons</h2>

      {/* Variants */}
      <div className="flex gap-4 flex-wrap">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>

      {/* Sizes */}
      <div className="flex gap-4 items-center flex-wrap">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>

      {/* Loading state */}
      <div className="flex gap-4 flex-wrap">
        <Button loading={loading} onClick={handleClick}>
          {loading ? 'Loading...' : 'Click me'}
        </Button>
        <Button disabled>Disabled</Button>
      </div>

      {/* Full width */}
      <Button fullWidth variant="primary">Full Width Button</Button>
    </div>
  );
}

/**
 * Input Examples
 */
export function InputExamples() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (e.target.value.length < 3) {
      setError('Must be at least 3 characters');
    } else {
      setError('');
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <h2 className="text-2xl font-bold">Text Inputs</h2>

      <TextInput
        label="Email"
        type="email"
        placeholder="you@example.com"
        fullWidth
      />

      <TextInput
        label="Password"
        type="password"
        placeholder="Enter your password"
        helperText="Must be at least 8 characters"
        fullWidth
      />

      <TextInput
        label="Username"
        value={value}
        onChange={handleChange}
        error={error}
        fullWidth
      />

      <TextInput
        placeholder="Disabled input"
        disabled
        fullWidth
      />
    </div>
  );
}

/**
 * Card Examples
 */
export function CardExamples() {
  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-2xl font-bold">Cards</h2>

      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>This is a card description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content goes here. You can put any content inside.</p>
        </CardContent>
        <CardFooter>
          <Button variant="primary">Action</Button>
          <Button variant="ghost">Cancel</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader actions={<Button size="sm">Edit</Button>}>
          <CardTitle>Card with Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This card has an action button in the header.</p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Avatar Examples
 */
export function AvatarExamples() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Avatars</h2>

      <div className="flex gap-4 items-center">
        <Avatar size="sm" name="John Doe" />
        <Avatar size="md" name="Jane Smith" />
        <Avatar size="lg" name="Bob Johnson" />
        <Avatar size="xl" name="Alice Williams" />
      </div>

      <div className="flex gap-4 items-center">
        <Avatar
          size="md"
          src="https://i.pravatar.cc/150?img=1"
          name="User with Image"
        />
        <Avatar size="md" name="JD" />
        <Avatar size="md" fallback="?" />
      </div>
    </div>
  );
}

/**
 * Badge Examples
 */
export function BadgeExamples() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Badges</h2>

      <div className="flex gap-4 flex-wrap">
        <Badge variant="default">Default</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="error">Error</Badge>
        <Badge variant="info">Info</Badge>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Badge variant="success" dot>Active</Badge>
        <Badge variant="warning" dot>Pending</Badge>
        <Badge variant="error" dot>Failed</Badge>
      </div>
    </div>
  );
}

/**
 * Modal Examples
 */
export function ModalExamples() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Modal</h2>

      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Example Modal"
        description="This is a modal dialog example"
        size="md"
      >
        <div className="space-y-4">
          <p>This is the modal content. You can put any React components here.</p>
          <TextInput label="Name" placeholder="Enter your name" fullWidth />
          <TextInput label="Email" type="email" placeholder="Enter your email" fullWidth />
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setIsOpen(false)}>
            Save
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

/**
 * Dropdown Examples
 */
export function DropdownExamples() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dropdown</h2>

      <Dropdown
        trigger={<Button>Open Dropdown</Button>}
      >
        <DropdownLabel>Account</DropdownLabel>
        <DropdownItem icon={<span>👤</span>}>Profile</DropdownItem>
        <DropdownItem icon={<span>⚙️</span>}>Settings</DropdownItem>
        <DropdownDivider />
        <DropdownItem danger icon={<span>🚪</span>}>
          Logout
        </DropdownItem>
      </Dropdown>
    </div>
  );
}

/**
 * Tabs Examples
 */
export function TabsExamples() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Tabs</h2>

      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Overview</TabsTrigger>
          <TabsTrigger value="tab2">Details</TabsTrigger>
          <TabsTrigger value="tab3">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="tab1">
          <Card>
            <CardContent>
              <p>Overview content goes here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tab2">
          <Card>
            <CardContent>
              <p>Details content goes here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tab3">
          <Card>
            <CardContent>
              <p>Settings content goes here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Empty State Examples
 */
export function EmptyStateExamples() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Empty States</h2>

      <Card>
        <EmptyState
          icon={<EmptyStateIcon />}
          title="No concerts yet"
          description="Get started by adding your first concert memory"
          action={{
            label: 'Add Concert',
            onClick: () => alert('Add concert clicked'),
          }}
          secondaryAction={{
            label: 'Learn More',
            onClick: () => alert('Learn more clicked'),
          }}
        />
      </Card>
    </div>
  );
}

/**
 * Spinner Examples
 */
export function SpinnerExamples() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Spinners</h2>

      <div className="flex gap-8 items-center">
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
      </div>

      <div className="flex gap-4">
        <div className="text-primary-600">
          <Spinner size="md" />
        </div>
        <div className="text-red-600">
          <Spinner size="md" />
        </div>
        <div className="text-green-600">
          <Spinner size="md" />
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard Layout Example
 */
export function DashboardLayoutExample() {
  const sidebarItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'Concerts',
      href: '/concerts',
      badge: 12,
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
    },
    {
      label: 'Memories',
      href: '/memories',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <DashboardLayout
      navbarProps={{
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        onLogout: () => console.log('Logout'),
      }}
      sidebarItems={sidebarItems}
    >
      <DashboardPageHeader
        title="Dashboard"
        description="Welcome to your Encore dashboard"
        actions={
          <Button variant="primary">Add Concert</Button>
        }
      />

      <DashboardSection
        title="Recent Concerts"
        description="Your latest concert memories"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent>
                <p>Concert {i}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardSection>
    </DashboardLayout>
  );
}

/**
 * All Examples Page
 */
export function AllComponentExamples() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <h1 className="text-4xl font-bold mb-2">Encore UI Components</h1>
          <p className="text-gray-600">
            A complete design system built with Tailwind CSS for Next.js 14
          </p>
        </div>

        <ButtonExamples />
        <InputExamples />
        <CardExamples />
        <AvatarExamples />
        <BadgeExamples />
        <ModalExamples />
        <DropdownExamples />
        <TabsExamples />
        <EmptyStateExamples />
        <SpinnerExamples />
      </div>
    </div>
  );
}
