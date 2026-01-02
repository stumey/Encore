# Encore - AI Coding Agent Reference

> **Purpose:** This file contains all essential information for AI coding agents (like Claude) to effectively work on the Encore codebase. Keep this updated as the project evolves.

**Last Updated:** December 30, 2025

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Web App (Next.js)](#web-app-nextjs)
6. [Mobile App (React Native)](#mobile-app-react-native)
7. [API & Backend](#api--backend)
8. [Common Patterns](#common-patterns)
9. [Media Upload System](#media-upload-system)
10. [Authentication System](#authentication-system)
11. [Component Library](#component-library)
12. [Revenue & Business Model](#revenue--business-model)
13. [Deployment](#deployment)
14. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Encore** is an AI-powered concert memory app that helps users track and organize their concert history through photo analysis.

### Core Value Proposition
- **Upload concert photos** → AI identifies artist, venue, date
- **Build concert history** automatically with zero manual entry
- **98% AI accuracy** using Claude API for photo analysis
- **Cross-platform:** Web (Next.js), iOS & Android (React Native/Expo)

### Key Features
- AI photo analysis (artist, venue, date detection)
- Concert timeline and statistics
- Setlist integration (Setlist.fm)
- Artist and venue tracking
- Media gallery with unlimited uploads (premium)
- Cross-platform sync

### Monetization
- **Free Tier:** 25 photos/month
- **Premium:** $4.99/month - unlimited photos, AI analysis, advanced stats
- **Target:** $1k MRR within 3 months of launch

---

## Quick Start

### Prerequisites
- **Node.js 20+**
- **Docker Desktop** (running) - required for PostgreSQL and LocalStack
- **PostgreSQL** (via Docker)
- AWS Account (Cognito for auth)
- AWS S3 bucket (media storage) - or use LocalStack for local dev
- Claude API key (AI analysis - optional for local)

### Startup Sequence

**⚠️ CRITICAL:** Services must be started in the correct order:

1. **Start Docker Desktop** (must be running first)
2. **Start local infrastructure** (PostgreSQL, LocalStack)
3. **Start the API server** (depends on PostgreSQL)
4. **Start the web/mobile apps**

```bash
# Step 1: Install dependencies (first time only)
make install

# Step 2: Start local infrastructure (PostgreSQL via Docker)
# ⚠️ Ensure Docker Desktop is running first!
make dev-up

# Step 3: Run database migrations (first time only)
make db-migrate

# Step 4: Start all application services
make dev

# OR start services individually:
make api      # API server → http://localhost:3001 (starts first!)
make web      # Web app → http://localhost:3000
make mobile   # Mobile app → Expo Dev Tools
```

### LocalStack S3 (Local Development)

To develop without a real AWS S3 bucket, use LocalStack:

```bash
# 1. Start infrastructure (includes LocalStack)
make dev-up

# 2. Start API with LocalStack S3
make api-local    # Uses LocalStack S3 at localhost:4566

# 3. Start web app (no changes needed)
make web

# Login with your real AWS Cognito account
# Media uploads go to LocalStack S3 instead of AWS
```

**Benefits:**
- No AWS S3 costs during development
- No S3 credentials needed
- Faster uploads (local network)
- Easy reset: `make dev-reset` clears all data

**Note:** Authentication still uses real AWS Cognito.

### Other Commands

```bash
# Build all apps
make build

# Run tests
make test

# Run linting
make lint

# Stop infrastructure
make dev-down

# View infrastructure logs
make dev-logs

# Reset all data (nuclear option)
make dev-reset
```

**⚠️ IMPORTANT:**
- Always use Makefile commands for consistency and proper environment setup
- DO NOT use direct `npm run` commands unless specifically required
- If the API fails to start, check that Docker is running and `make dev-up` succeeded

### Environment Variables

**Web (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_COGNITO_REGION=us-east-2
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_tmLfmErrL
NEXT_PUBLIC_COGNITO_CLIENT_ID=48t4jutclucc18p84qpb2skjo3
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Mobile (.env):**
```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api/v1
EXPO_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_tmLfmErrL
EXPO_PUBLIC_COGNITO_CLIENT_ID=48t4jutclucc18p84qpb2skjo3
EXPO_PUBLIC_COGNITO_REGION=us-east-2
```

---

## Architecture

### Monorepo Structure

```
encore/
├── apps/
│   ├── web/              # Next.js 14 web app
│   ├── mobile/           # React Native + Expo app
│   └── api/              # Express.js backend API
├── packages/
│   └── shared/           # Shared TypeScript types, schemas, utils
├── CLAUDE.md            # This file (AI agent reference)
├── REVENUE_STRATEGY.md  # Business strategy
└── package.json         # Root workspace config
```

### Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Web Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Mobile Frontend** | React Native, Expo SDK 51, Expo Router |
| **Backend API** | Express.js, Prisma ORM, PostgreSQL |
| **Authentication** | AWS Cognito |
| **Media Storage** | AWS S3 + CloudFront |
| **AI Analysis** | Claude API (Anthropic) |
| **State Management** | TanStack Query (React Query) |
| **Shared Code** | TypeScript types, Zod schemas |

### Data Flow

```
User Upload Photo
    ↓
Frontend (Web/Mobile)
    ↓
POST /media/upload-url → Get S3 presigned URL
    ↓
Direct upload to S3 (with progress tracking)
    ↓
POST /media → Create DB record
    ↓
POST /media/:id/analyze → Trigger AI analysis
    ↓
Claude API analyzes photo
    ↓
Results stored in DB
    ↓
Frontend displays concert info
```

---

## Technology Stack

### Web App Dependencies

**Core:**
- `next`: 14.2.35 (App Router)
- `react`: 18.2.0 ⚠️ **Pinned to 18.2.0** (React Native constraint)
- `react-dom`: 18.2.0
- `typescript`: ^5.3.0
- `tailwindcss`: ^3.4.0

**State & Data:**
- `@tanstack/react-query`: ^5.0.0 (caching, state)
- `axios`: ^1.6.8 (HTTP client)

**Authentication:**
- `aws-amplify`: ^6.0.0
- `@aws-amplify/auth`: ^6.0.0

**Types:**
- `@encore/shared`: * (workspace)

### Mobile App Dependencies

**Core:**
- `expo`: ~51.0.0
- `expo-router`: ~3.5.0
- `react-native`: 0.74.0 (requires React 18.2.0)
- `react`: 18.2.0

**State & Data:**
- `@tanstack/react-query`: ^5.28.0
- `zustand`: ^4.5.2 (auth state)
- `axios`: ^1.6.8

**Authentication:**
- `amazon-cognito-identity-js`: ^6.3.12
- `expo-secure-store`: ^13.0.0 (token storage)

**Media:**
- `expo-image`: ^1.12.0
- `expo-image-picker`: ^15.0.0

### Backend/API

**Framework:**
- `express`: ^4.18.0
- `prisma`: ^5.0.0 (ORM)
- `@prisma/client`: ^5.0.0

**AWS:**
- `@aws-sdk/client-s3`: For S3 operations
- `@aws-sdk/s3-request-presigner`: Presigned URLs

**AI:**
- `@anthropic-ai/sdk`: Claude API

---

## Web App (Next.js)

### File Structure

```
apps/web/src/
├── app/
│   ├── (dashboard)/           # Protected routes
│   │   ├── layout.tsx         # Dashboard wrapper
│   │   ├── dashboard/         # Main dashboard
│   │   ├── concerts/          # Concert management
│   │   ├── media/             # Media gallery & upload
│   │   ├── artists/           # Artist pages
│   │   ├── venues/            # Venue pages
│   │   └── stats/             # Statistics page
│   ├── (marketing)/           # Public marketing pages
│   │   ├── layout.tsx         # Marketing nav/footer
│   │   ├── page.tsx           # Landing page
│   │   ├── pricing/           # Pricing page
│   │   └── privacy/           # Privacy policy
│   └── auth/                  # Auth pages (signin, signup, etc.)
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── layout/                # Layout components
│   ├── concerts/              # Concert-specific
│   ├── media/                 # Media-specific
│   ├── artists/               # Artist-specific
│   └── venues/                # Venue-specific
├── lib/
│   ├── auth/                  # Auth system (Cognito)
│   └── api/                   # API client & React Query hooks
└── middleware.ts              # Route protection
```

### Key Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page (marketing) |
| `/pricing` | Pricing page |
| `/auth/signin` | Sign in |
| `/auth/signup` | Sign up |
| `/dashboard` | Main dashboard (protected) |
| `/concerts` | Concert list (protected) |
| `/concerts/[id]` | Concert detail |
| `/concerts/new` | Create concert |
| `/media` | Media gallery (protected) |
| `/media/upload` | Upload media |
| `/artists` | Artists list |
| `/artists/[id]` | Artist detail |
| `/venues` | Venues list |
| `/venues/[id]` | Venue detail |
| `/stats` | Statistics dashboard |

### API Hooks (React Query)

All hooks are in `/apps/web/src/lib/api/hooks/`:

```typescript
// User hooks
useCurrentUser()
useUpdateUser()
useUserStats()

// Concert hooks
useConcerts(params)
useConcert(id)
useCreateConcert()
useUpdateConcert()
useDeleteConcert()

// Media hooks
useMedia(page, limit, filters)
useUploadUrl()
useCreateMedia()
useAnalyzeMedia()
useDeleteMedia()

// Artist hooks
useArtists(params)
useArtist(id)

// Venue hooks
useVenues(params)
useVenue(id)
```

### Running the Web App

```bash
cd apps/web
npm install
npm run dev
```

Visit: http://localhost:3000

---

## Mobile App (React Native)

### File Structure

```
apps/mobile/
├── app/                       # Expo Router (file-based)
│   ├── _layout.tsx           # Root layout
│   ├── (auth)/               # Auth screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/               # Main app tabs
│   │   ├── index.tsx         # Dashboard
│   │   ├── concerts/         # Concerts
│   │   ├── media.tsx         # Media gallery
│   │   └── profile.tsx       # Profile
│   ├── onboarding/           # Onboarding flow
│   ├── artists/              # Artist screens
│   ├── venues/               # Venue screens
│   └── media/                # Media screens
├── components/
│   ├── ui/                   # Base UI components
│   ├── concerts/
│   ├── media/
│   └── artists/
├── lib/
│   ├── auth/                 # Cognito auth
│   └── api/                  # API client & hooks
└── constants/
    ├── Colors.ts             # Theme colors
    └── Config.ts             # App config
```

### Key Features

- **Authentication:** AWS Cognito with Zustand state management
- **Navigation:** Expo Router (file-based)
- **State:** TanStack Query for data, Zustand for auth
- **Media:** expo-image-picker, direct S3 upload
- **Storage:** expo-secure-store for JWT tokens

### Running the Mobile App

```bash
cd apps/mobile
npm install
npm start

# Then:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Scan QR code with Expo Go app
```

### Building for Production

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## API & Backend

### API Endpoints

**User:**
- `GET /users/me` - Current user
- `PATCH /users/me` - Update profile
- `GET /users/me/stats` - User statistics

**Concerts:**
- `GET /concerts` - List concerts (paginated)
- `GET /concerts/:id` - Get concert
- `POST /concerts` - Create concert
- `PATCH /concerts/:id` - Update concert
- `DELETE /concerts/:id` - Delete concert

**Media:**
- `GET /media` - List media (paginated, filterable)
- `POST /media/upload-url` - Get S3 presigned URL
- `POST /media` - Create media record
- `POST /media/:id/analyze` - Trigger AI analysis
- `DELETE /media/:id` - Delete media

**Artists:**
- `GET /artists` - List artists
- `GET /artists/:id` - Get artist
- `POST /artists` - Create artist

**Venues:**
- `GET /venues` - List venues
- `GET /venues/:id` - Get venue
- `POST /venues` - Create venue

### Database Schema (Prisma)

Key models (simplified):

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  concerts  Concert[]
  media     Media[]
}

model Concert {
  id          String    @id @default(cuid())
  date        DateTime
  venue       Venue     @relation(...)
  artists     ConcertArtist[]
  media       Media[]
  userId      String
  user        User      @relation(...)
}

model Media {
  id              String    @id @default(cuid())
  mediaType       MediaType
  storagePath     String
  downloadUrl     String?
  thumbnailUrl    String?
  aiAnalysis      Json?
  concertId       String?
  concert         Concert?  @relation(...)
  userId          String
  user            User      @relation(...)
}

model Artist {
  id       String    @id @default(cuid())
  name     String
  imageUrl String?
  concerts ConcertArtist[]
}

model Venue {
  id       String    @id @default(cuid())
  name     String
  city     String?
  state    String?
  country  String?
  concerts Concert[]
}
```

---

## Common Patterns

### Adding a New Feature

1. **Update shared types** (if needed):
   ```bash
   cd packages/shared
   # Edit src/types/index.ts
   npm run build
   ```

2. **Add API endpoint** (backend):
   ```typescript
   // apps/api/src/routes/yourFeature.ts
   router.get('/your-endpoint', async (req, res) => {
     // Implementation
   });
   ```

3. **Create React Query hook** (web):
   ```typescript
   // apps/web/src/lib/api/hooks/use-your-feature.ts
   export function useYourFeature() {
     return useQuery({
       queryKey: ['yourFeature'],
       queryFn: () => api.get('/your-endpoint'),
     });
   }
   ```

4. **Create component/page**:
   ```typescript
   // apps/web/src/app/(dashboard)/your-feature/page.tsx
   export default function YourFeaturePage() {
     const { data } = useYourFeature();
     return <div>{/* UI */}</div>;
   }
   ```

### Making API Calls

**Web:**
```typescript
import { api } from '@/lib/api/client';

// With React Query (preferred)
const { data, isLoading } = useYourHook();

// Direct call
const response = await api.get('/endpoint');
```

**Mobile:**
```typescript
import { api } from '@/lib/api/client';

// Same pattern as web
const { data } = useYourHook();
```

### Authentication Pattern

**Check if user is authenticated:**
```typescript
// Web
import { useAuth } from '@/lib/auth';
const { user, isAuthenticated, isLoading } = useAuth();

// Mobile
import { useAuth } from '@/lib/auth/useAuth';
const { user, isAuthenticated } = useAuth();
```

**Protected route (web):**
- Routes under `(dashboard)` are auto-protected by middleware
- Add more in `apps/web/src/middleware.ts`

**Make authenticated request:**
```typescript
// Axios client automatically adds JWT token
const data = await api.get('/users/me');
```

---

## Media Upload System

### Upload Flow

```
1. User selects files
   ↓
2. POST /media/upload-url
   → Returns: { uploadUrl, storagePath }
   ↓
3. Direct upload to S3 using presigned URL
   → Track progress with XHR
   ↓
4. POST /media
   → Body: { mediaType, storagePath, originalFilename }
   → Returns: MediaWithUrls
   ↓
5. POST /media/:id/analyze (optional)
   → Triggers AI analysis (async)
   ↓
6. Display in gallery
```

### File Validation

**Client-side:**
```typescript
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png',
  'image/gif', 'image/webp', 'image/heic', 'image/heif'
];

const ACCEPTED_VIDEO_TYPES = [
  'video/mp4', 'video/quicktime', 'video/x-msvideo',
  'video/webm', 'video/x-matroska'
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
```

### Upload Code Example

```typescript
async function uploadFile(file: File) {
  // 1. Get presigned URL
  const { uploadUrl, storagePath } = await uploadUrlMutation.mutateAsync({
    contentType: file.type,
    filename: file.name,
  });

  // 2. Upload to S3 with progress
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      const progress = (e.loaded / e.total) * 100;
      setProgress(progress);
    });
    xhr.addEventListener('load', () => resolve());
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });

  // 3. Create media record
  const media = await createMediaMutation.mutateAsync({
    mediaType: file.type.startsWith('video/') ? 'video' : 'photo',
    storagePath,
    originalFilename: file.name,
  });

  // 4. Analyze with AI
  if (analyzeWithAI) {
    await analyzeMediaMutation.mutateAsync(media.id);
  }

  return media;
}
```

### Key Components

**Web:**
- `apps/web/src/app/(dashboard)/media/page.tsx` - Gallery
- `apps/web/src/app/(dashboard)/media/upload/page.tsx` - Upload
- `apps/web/src/components/media/media-modal.tsx` - Viewer
- `apps/web/src/components/media/upload-dropzone.tsx` - Drag & drop

**Mobile:**
- `apps/mobile/app/(tabs)/media.tsx` - Gallery
- `apps/mobile/app/media/upload.tsx` - Upload

---

## Authentication System

### AWS Cognito Setup

**User Pool Configuration:**
- Sign-in: Email
- Password: Min 8 chars, uppercase, lowercase, numbers, special chars
- Email verification: Required
- MFA: Optional
- App client: Public (no client secret)

### Auth Flow

**Sign Up:**
```
1. User enters email + password
2. Cognito.signUp()
3. Cognito sends verification code to email
4. User enters code
5. Cognito.confirmSignUp()
6. Account confirmed → Redirect to sign in
```

**Sign In:**
```
1. User enters credentials
2. Cognito.signIn()
3. JWT tokens returned
4. Tokens stored in:
   - Web: Cookies (httpOnly)
   - Mobile: expo-secure-store
5. Redirect to dashboard
```

**API Authentication:**
```
All API requests include:
headers: {
  Authorization: `Bearer ${accessToken}`
}

Backend validates JWT on every request.
```

### Auth Hooks

```typescript
// Web & Mobile (similar API)
const {
  user,                    // Current user object
  isAuthenticated,         // Boolean
  isLoading,              // Loading state
  signIn,                 // (email, password) => Promise
  signUp,                 // (email, password) => Promise
  signOut,                // () => Promise
  confirmSignUp,          // (email, code) => Promise
  resetPassword,          // (email) => Promise
  confirmResetPassword,   // (email, code, newPassword) => Promise
} = useAuth();
```

### Protected Routes

**Web:**
- Middleware protects routes under `/dashboard/*`
- Add more in `apps/web/src/middleware.ts`

**Mobile:**
- `(tabs)` routes check auth state
- Redirect to login if not authenticated

---

## Component Library

### UI Components (Shared)

Located in `apps/web/src/components/ui/`:

```typescript
import {
  Button,         // Variants: primary, secondary, outline, ghost, danger
  TextInput,      // With label, error, helper text
  Card,           // CardHeader, CardContent, CardFooter
  Avatar,         // Sizes: sm, md, lg, xl
  Badge,          // Variants: default, success, warning, error, info
  Spinner,        // Loading indicator
  Modal,          // Portal-based modal
  Dropdown,       // Dropdown menu
  Tabs,           // Tabbed interface
  EmptyState,     // Placeholder with CTA
} from '@/components/ui';
```

### Layout Components

```typescript
import {
  DashboardLayout,       // Full dashboard wrapper
  DashboardPageHeader,   // Page title + actions
  DashboardSection,      // Content section
  Navbar,                // Top navigation
  Sidebar,               // Side navigation
} from '@/components/layout';
```

### Design System

**Colors:**
- Primary: `purple-600` (#9333ea)
- Success: `green-600`
- Warning: `yellow-600`
- Error: `red-600`

**Spacing:** 4px base (`p-4`, `gap-4`)
**Borders:** `rounded-lg`
**Shadows:** `shadow-sm`, `shadow-md`, `shadow-lg`
**Transitions:** `duration-200`

### Common Usage

```tsx
// Dashboard page
<DashboardLayout>
  <DashboardPageHeader
    title="Concerts"
    description="Manage your concert memories"
    actions={<Button onClick={handleAdd}>Add Concert</Button>}
  />

  <DashboardSection title="Recent">
    {/* Content */}
  </DashboardSection>
</DashboardLayout>

// Form
<TextInput
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  fullWidth
/>

// Modal
<Modal isOpen={showModal} onClose={handleClose} title="Confirm">
  <p>Are you sure?</p>
  <ModalFooter>
    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
    <Button variant="danger" onClick={handleDelete}>Delete</Button>
  </ModalFooter>
</Modal>
```

---

## Revenue & Business Model

### Pricing

**Free Tier:**
- 25 photos/month
- AI analysis
- Basic stats
- Cross-platform sync

**Premium - $4.99/month:**
- Unlimited photos
- Priority AI processing
- Advanced stats
- Export features
- Ad-free

### Unit Economics

**Free User Cost:** ~$0.30-0.80/month
- Claude API: $0.25-0.75 (25 photos × $0.01-0.03)
- S3 Storage: ~$0.002
- Infrastructure: ~$0.05

**Premium User Revenue:** $4.84/month (after 3% Stripe fees)
**Premium User Cost:** ~$2.05/month (100 photos avg)
**Profit per Premium User:** ~$2.79/month

### Revenue Targets

- **Month 1:** 10 paying users, $50 MRR
- **Month 2:** 50 paying users, $250 MRR
- **Month 3:** 200 paying users, $1,000 MRR
- **Year 1:** $10k MRR, 2,000 paying users

### Conversion Strategy

**Freemium Funnel:**
```
User signs up (free)
    ↓
Uploads photos (free tier)
    ↓
Sees AI magic ("Aha!" moment)
    ↓
Hits 25 photo limit
    ↓
Upgrade modal
    ↓
Converts to premium (10% conversion rate target)
```

---

## Deployment

### Preferred Stack

**Web App → Vercel (Recommended)**
- Built by Next.js creators
- Zero-config deployments
- Automatic HTTPS & CDN
- Generous free tier
- Perfect Next.js integration
- Auto-preview deployments

**API/Backend:**
- **MVP:** Railway ($5-20/mo) - Simple, great DX
- **Scale:** AWS ECS Fargate ($50-100/mo at 1k users)

### Web App Deployment (Vercel)

**Setup:**
1. Connect GitHub repo to Vercel
2. Auto-deploys on push to main
3. Set environment variables in Vercel dashboard

**Environment Variables (Vercel):**
```
NEXT_PUBLIC_API_URL=https://api.encore.app
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Manual Deploy:**
```bash
cd apps/web
npm run build
vercel --prod
```

### API Deployment (Railway)

**Setup:**
1. Connect GitHub repo
2. Select `apps/api` as root directory
3. Configure PostgreSQL add-on
4. Set environment variables
5. Deploy automatically on push

**Environment Variables (Railway):**
```
DATABASE_URL=postgresql://... (auto-configured)
JWT_SECRET=your-secret
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=encore-media
CLAUDE_API_KEY=...
```

### Mobile App (EAS Build)

**Build:**
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

**Submit:**
```bash
eas submit --platform ios
eas submit --platform android
```

### Infrastructure

**Required AWS Services:**
- **S3:** Media storage ($5-10/mo)
- **CloudFront:** CDN for media delivery (optional, ~$5/mo)
- **Cognito:** Authentication (free tier: 50k MAU)

**Database:**
- Railway PostgreSQL (included)
- Or AWS RDS when scaling ($40/mo for db.t3.small)

---

## Troubleshooting

### Common Issues

**⚠️ API not starting / "Could not connect to server" errors:**

This is the most common issue. The API fails silently if PostgreSQL isn't running.

**Symptoms:**
- Web app shows: `Fetch API cannot load http://localhost:3001/... due to access control checks`
- API calls missing `/api/v1` path in the URL
- Port 3001 not in use when running `lsof -i :3001`
- Multiple `tsx` processes stuck running

**Solution:**
```bash
# 1. Kill any stuck tsx processes
pkill -f "tsx watch"

# 2. Ensure Docker Desktop is running (check menu bar)

# 3. Start local infrastructure
make dev-up

# 4. Verify PostgreSQL is running
lsof -i :5432  # Should show postgres process

# 5. Start the API
make api

# 6. Verify API is running
lsof -i :3001  # Should show node process
curl http://localhost:3001/api/v1/health  # Should return 200 OK
```

**Root cause:** The API requires PostgreSQL, which runs in Docker. If Docker isn't running or `make dev-up` wasn't executed, the API fails to start silently.

---

**"Module not found" errors:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Or workspace root:
npm install --workspaces
```

**TypeScript errors after updating shared:**
```bash
cd packages/shared
npm run build

# Then restart dev server
```

**Cognito auth errors:**
- Check environment variables are set
- Verify User Pool ID and Client ID
- Ensure App Client has no client secret
- Clear browser cookies/app storage

**Upload not working:**
- Check S3 CORS configuration
- Verify presigned URL expiration
- Check file size limits
- Monitor browser console for errors

**API 401 errors:**
- Token may be expired (check refresh logic)
- Verify JWT is being sent in headers
- Check Cognito token validation

**Mobile app won't build:**
```bash
# Clear Expo cache
expo start -c

# Or
rm -rf node_modules
npm install
```

### Performance Issues

**Slow gallery loading:**
- Check pagination (limit to 24 items)
- Verify thumbnail URLs are being used
- Enable lazy loading for images
- Check React Query cache settings

**Slow uploads:**
- Verify direct S3 upload (not proxied)
- Check network conditions
- Consider client-side image compression

### Debug Commands

```bash
# Type checking
npm run type-check

# Build check
npm run build

# Check React Query cache
# Open DevTools → React Query Devtools

# Monitor API calls
# Open DevTools → Network tab
```

---

## Additional Resources

### Documentation Files
- `REVENUE_STRATEGY.md` - Full business strategy and roadmap
- `apps/web/README.md` - Web app deep dive (if exists)
- `apps/mobile/README.md` - Mobile app deep dive (if exists)

### External Docs
- [Next.js 14](https://nextjs.org/docs)
- [Expo](https://docs.expo.dev)
- [TanStack Query](https://tanstack.com/query)
- [AWS Amplify](https://docs.amplify.aws)
- [Tailwind CSS](https://tailwindcss.com)
- [Prisma](https://www.prisma.io/docs)

---

## Notes for AI Coding Agents

### When Working on This Codebase

1. **Always read this file first** for context
2. **Check shared types** in `packages/shared/src/types/` before creating new types
3. **Use existing patterns** - see Common Patterns section
4. **Update React Query cache** after mutations
5. **Follow the upload flow** exactly for media features
6. **Never skip authentication** checks
7. **Use the component library** - don't create new basic components
8. **Keep web and mobile in sync** for API contracts

### Code Style

- TypeScript strict mode enabled
- Functional components only
- React Query for all data fetching
- Tailwind CSS for styling (no CSS modules)
- ESLint + Prettier configured
- Avoid over-engineering (keep it simple)

### TypeScript Guidelines

- **Prefer `@types/*` packages over custom `.d.ts` files** - Before creating a custom type declaration in `src/types/`, check if official types exist: `npm view @types/<package-name>`. Install them as dev dependencies.
- Custom `.d.ts` files are a last resort for packages with no published types
- Keep `skipLibCheck: false` (the default) to catch type issues in dependencies

### Backend Architecture (Onion Architecture)

Follow onion architecture principles - dependencies point inward, outer layers depend on inner layers:

```
┌─────────────────────────────────────────────────────────┐
│  Infrastructure (outermost)                             │
│  - Routes (HTTP handlers) - thin, validation + response │
│  - Database (Prisma client)                             │
│  - External APIs (S3, Claude, Setlist.fm)               │
├─────────────────────────────────────────────────────────┤
│  Application/Services                                   │
│  - Business logic orchestration                         │
│  - Use cases (e.g., mediaAnalysisService)               │
├─────────────────────────────────────────────────────────┤
│  Domain (innermost)                                     │
│  - Entities, types, validation schemas                  │
│  - Pure functions, no external dependencies             │
└─────────────────────────────────────────────────────────┘
```

**Rules:**
- **Routes** → Validate input, call service, return response. No business logic.
- **Services** → Orchestrate use cases, call other services/repositories. Testable in isolation.
- **Domain** → Pure types and logic. No imports from infrastructure.

**Example:** `media.routes.ts` calls `mediaAnalysisService.runAnalysis()` - the route doesn't know about S3, Claude, or FFmpeg.

### Testing Reminders

- Test auth flows (signup, signin, signout)
- Test file uploads (photos and videos)
- Test pagination and filtering
- Test responsive layouts (mobile/tablet/desktop)
- Check browser console for errors
- Verify API calls in Network tab

---

**This is a living document. Update it as the project evolves.**
