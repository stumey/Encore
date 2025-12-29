# Encore UI Component Library

A comprehensive set of reusable UI components built for the Encore Next.js 14 web app using Tailwind CSS.

## Design System

- **Primary Color**: purple-600 (#9333ea)
- **Spacing**: Consistent use of p-4, gap-4, etc.
- **Rounded Corners**: rounded-lg for cards and inputs
- **Shadows**: shadow-sm, shadow-md for elevation
- **Transitions**: Smooth 200ms transitions for interactive elements

## UI Components

### Button (`/ui/button.tsx`)

A versatile button component with multiple variants and states.

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean - Shows spinner when true
- `fullWidth`: boolean - Makes button full width
- All standard button HTML attributes

**Usage:**
```tsx
import { Button } from '@/components/ui/button';

<Button variant="primary" size="md" loading={false}>
  Click me
</Button>
```

### TextInput (`/ui/text-input.tsx`)

Form input component with label, error states, and helper text.

**Props:**
- `label`: string - Input label
- `error`: string - Error message
- `helperText`: string - Helper text shown below input
- `fullWidth`: boolean - Makes input full width
- All standard input HTML attributes

**Usage:**
```tsx
import { TextInput } from '@/components/ui/text-input';

<TextInput
  label="Email"
  type="email"
  error={errors.email}
  helperText="We'll never share your email"
  fullWidth
/>
```

### Card (`/ui/card.tsx`)

Container component with header, content, and footer sections.

**Components:**
- `Card` - Main container
- `CardHeader` - Header with optional actions
- `CardTitle` - Title text
- `CardDescription` - Description text
- `CardContent` - Main content area
- `CardFooter` - Footer with actions

**Usage:**
```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Concert Details</CardTitle>
    <CardDescription>View your concert information</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

### Avatar (`/ui/avatar.tsx`)

User avatar with image fallback to initials.

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `src`: string - Image URL
- `name`: string - User name (used for initials)
- `fallback`: string - Fallback text if no name

**Usage:**
```tsx
import { Avatar } from '@/components/ui/avatar';

<Avatar
  size="md"
  src="/avatar.jpg"
  name="John Doe"
/>
```

### Badge (`/ui/badge.tsx`)

Small status indicator or tag component.

**Props:**
- `variant`: 'default' | 'success' | 'warning' | 'error' | 'info'
- `dot`: boolean - Shows a colored dot indicator

**Usage:**
```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="success" dot>Active</Badge>
```

### Spinner (`/ui/spinner.tsx`)

Loading indicator component.

**Props:**
- `size`: 'sm' | 'md' | 'lg'
- `className`: string - Additional CSS classes

**Usage:**
```tsx
import { Spinner } from '@/components/ui/spinner';

<Spinner size="md" />
```

### Modal (`/ui/modal.tsx`)

Dialog/modal overlay component with portal rendering.

**Props:**
- `isOpen`: boolean - Controls visibility
- `onClose`: () => void - Close handler
- `title`: string - Modal title
- `description`: string - Modal description
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `showCloseButton`: boolean
- `closeOnOverlayClick`: boolean
- `closeOnEscape`: boolean

**Components:**
- `Modal` - Main modal component
- `ModalFooter` - Footer section for actions

**Usage:**
```tsx
import { Modal, ModalFooter } from '@/components/ui/modal';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  description="Are you sure?"
>
  <p>Modal content</p>
  <ModalFooter>
    <Button onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </ModalFooter>
</Modal>
```

### Dropdown (`/ui/dropdown.tsx`)

Dropdown menu component with items and dividers.

**Components:**
- `Dropdown` - Main dropdown container
- `DropdownItem` - Menu item
- `DropdownDivider` - Separator line
- `DropdownLabel` - Section label

**Usage:**
```tsx
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
  DropdownLabel
} from '@/components/ui/dropdown';

<Dropdown trigger={<Button>Menu</Button>}>
  <DropdownLabel>Account</DropdownLabel>
  <DropdownItem>Profile</DropdownItem>
  <DropdownItem>Settings</DropdownItem>
  <DropdownDivider />
  <DropdownItem danger>Logout</DropdownItem>
</Dropdown>
```

### Tabs (`/ui/tabs.tsx`)

Tabbed navigation component.

**Components:**
- `Tabs` - Container with state management
- `TabsList` - Tab button container
- `TabsTrigger` - Individual tab button
- `TabsContent` - Content for each tab

**Usage:**
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

### EmptyState (`/ui/empty-state.tsx`)

Component for displaying empty states with optional actions.

**Props:**
- `icon`: ReactNode - Icon element
- `title`: string - Main heading
- `description`: string - Description text
- `action`: { label: string, onClick: () => void } - Primary action
- `secondaryAction`: { label: string, onClick: () => void } - Secondary action

**Usage:**
```tsx
import { EmptyState, EmptyStateIcon } from '@/components/ui/empty-state';

<EmptyState
  icon={<EmptyStateIcon />}
  title="No concerts yet"
  description="Get started by adding your first concert"
  action={{ label: 'Add Concert', onClick: handleAdd }}
/>
```

## Layout Components

### Navbar (`/layout/navbar.tsx`)

Top navigation bar with logo, links, and user menu.

**Props:**
- `logo`: ReactNode - Custom logo component
- `logoHref`: string - Logo link destination
- `navLinks`: NavLink[] - Navigation links
- `user`: { name, email, avatar } - User information
- `onLogout`: () => void - Logout handler
- `actions`: ReactNode - Additional action buttons

**Usage:**
```tsx
import { Navbar } from '@/components/layout/navbar';

<Navbar
  navLinks={[
    { label: 'Home', href: '/', active: true },
    { label: 'Concerts', href: '/concerts' },
  ]}
  user={{
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/avatar.jpg'
  }}
  onLogout={handleLogout}
/>
```

### Sidebar (`/layout/sidebar.tsx`)

Sidebar navigation for dashboard layouts.

**Props:**
- `items`: SidebarItem[] - Navigation items
- `collapsed`: boolean - Collapsed state

**Usage:**
```tsx
import { Sidebar } from '@/components/layout/sidebar';

<Sidebar
  items={[
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <DashboardIcon />,
      badge: '3'
    }
  ]}
  collapsed={false}
/>
```

### DashboardLayout (`/layout/dashboard-layout.tsx`)

Complete dashboard layout with navbar and sidebar.

**Components:**
- `DashboardLayout` - Main layout wrapper
- `DashboardPageHeader` - Page header with title and actions
- `DashboardSection` - Section container with optional title

**Usage:**
```tsx
import {
  DashboardLayout,
  DashboardPageHeader,
  DashboardSection
} from '@/components/layout/dashboard-layout';

<DashboardLayout
  navbarProps={{ user, onLogout }}
  sidebarItems={sidebarItems}
>
  <DashboardPageHeader
    title="Dashboard"
    description="Welcome back"
    actions={<Button>New Concert</Button>}
  />
  <DashboardSection title="Recent Activity">
    {/* Content */}
  </DashboardSection>
</DashboardLayout>
```

## Installation & Setup

All required dependencies are already in package.json:
- next ^14.2.0
- react ^18.2.0
- tailwindcss ^3.4.0
- autoprefixer ^10.4.0
- postcss ^8.4.0

The Tailwind config is already set up with the design system colors and utilities.

## Importing Components

### Individual imports:
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
```

### Barrel imports:
```tsx
import { Button, Card, Badge, Avatar } from '@/components/ui';
import { Navbar, Sidebar, DashboardLayout } from '@/components/layout';
```

## Examples

See `/components/examples.tsx` for comprehensive usage examples of all components.

## Component Patterns

### Accessibility
- All components include proper ARIA attributes
- Keyboard navigation support where applicable
- Focus management in modals and dropdowns
- Screen reader announcements for dynamic content

### Performance
- Client-side rendering with 'use client' directive
- Optimized re-renders with React.memo where beneficial
- Lazy loading for modal portal content
- Efficient event handlers with proper cleanup

### Type Safety
- Full TypeScript support with exported prop types
- Proper interface inheritance from HTML elements
- Generic type support where applicable

### Styling
- Tailwind utility classes for consistency
- Responsive design built-in
- Dark mode ready (extend as needed)
- Customizable through className prop
- Consistent spacing and sizing scale

## Best Practices

1. **Always use fullWidth prop** for inputs and buttons in forms
2. **Provide labels** for all form inputs for accessibility
3. **Use consistent sizing** across related components
4. **Leverage TypeScript types** for prop validation
5. **Test interactive states** (hover, focus, disabled, loading)
6. **Handle loading states** for async operations
7. **Provide feedback** for user actions (toasts, modals, etc.)

## Future Enhancements

Potential additions:
- Toast/notification system
- Select/combobox components
- Date picker
- Table component
- Pagination
- Tooltip component
- Progress indicators
- File upload
- Rich text editor integration
- Dark mode toggle
