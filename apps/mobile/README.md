# Encore Mobile App

React Native mobile application for tracking concerts, built with Expo and TypeScript.

## Features

- **Authentication**: AWS Cognito integration with secure token storage
- **Concert Tracking**: Add, view, and manage concert experiences
- **Media Gallery**: Upload photos/videos with AI analysis
- **Artist & Venue Management**: Track favorite artists and venues
- **Offline Support**: React Query caching for offline viewing
- **Dark Mode**: Automatic theme switching

## Tech Stack

- **Framework**: React Native + Expo SDK 51
- **Routing**: Expo Router (file-based)
- **State Management**: Zustand + TanStack Query
- **Authentication**: AWS Cognito (amazon-cognito-identity-js)
- **Storage**: Expo Secure Store
- **API Client**: Axios
- **Image Handling**: Expo Image + Image Picker
- **UI**: Custom components with purple-600 theme

## Project Structure

```
apps/mobile/
├── app/                          # Expo Router file-based routing
│   ├── (auth)/                  # Auth screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/                  # Main app tabs
│   │   ├── index.tsx            # Dashboard
│   │   ├── concerts/            # Concerts list & detail
│   │   ├── media.tsx            # Media gallery
│   │   └── profile.tsx          # Profile & settings
│   ├── artists/                 # Artist screens
│   ├── venues/                  # Venue screens
│   └── media/                   # Media upload & detail
├── components/                  # Reusable components
│   ├── ui/                      # Base UI components
│   ├── concerts/                # Concert-specific components
│   ├── media/                   # Media-specific components
│   └── artists/                 # Artist-specific components
├── lib/                         # Core libraries
│   ├── auth/                    # Cognito auth + hooks
│   ├── api/                     # API client + hooks
│   └── storage/                 # Secure storage
└── constants/                   # Colors & config

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Studio

### Installation

1. Install dependencies:
```bash
cd apps/mobile
npm install
```

2. Configure environment variables:
   - Update `constants/Config.ts` with your AWS Cognito credentials
   - Set API URL for your backend

3. Start the development server:
```bash
npm start
```

4. Run on device/simulator:
```bash
# iOS
npm run ios

# Android
npm run android

# Web (for testing)
npm run web
```

## Configuration

### AWS Cognito Setup

Update `constants/Config.ts`:

```typescript
export default {
  API_URL: 'https://api.encore.app/api',
  COGNITO_USER_POOL_ID: 'us-east-1_XXXXXXXXX',
  COGNITO_CLIENT_ID: 'your-client-id',
  COGNITO_REGION: 'us-east-1',
  S3_BUCKET: 'encore-media-prod',
  S3_REGION: 'us-east-1',
};
```

### Environment Variables

Use `.env` files for different environments:

```env
EXPO_PUBLIC_API_URL=https://api.encore.app/api
EXPO_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
EXPO_PUBLIC_COGNITO_CLIENT_ID=your-client-id
```

## API Integration

The app uses TanStack Query for data fetching with custom hooks:

- `useAuth()` - Authentication state & methods
- `useConcerts()` - Concert CRUD operations
- `useMedia()` - Media upload & management
- `useArtists()` - Artist data
- `useVenues()` - Venue data

All API hooks are in `lib/api/hooks/`.

## Authentication Flow

1. User signs in with email/password
2. Cognito returns JWT tokens
3. Tokens stored in Expo Secure Store
4. API client injects JWT in Authorization header
5. Auto-refresh on 401 errors
6. Auto-redirect on auth state changes

## Media Upload

1. Select photo/video from library or camera
2. Choose associated concert
3. Optional: Add caption & enable AI analysis
4. Request presigned S3 upload URL from API
5. Upload directly to S3
6. Backend processes & analyzes media

## Building for Production

### iOS

```bash
# Build for App Store
eas build --platform ios --profile production

# Or local build
npx expo run:ios --configuration Release
```

### Android

```bash
# Build APK/AAB
eas build --platform android --profile production

# Or local build
npx expo run:android --variant release
```

## Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Run tests (when configured)
npm test
```

## Troubleshooting

### Common Issues

1. **Metro bundler errors**: Clear cache with `expo start -c`
2. **Build errors**: Delete `node_modules` and reinstall
3. **iOS simulator not showing**: Run `npx expo run:ios` directly
4. **Android build fails**: Check Java version and Android SDK

### Debug Mode

Enable remote debugging:
1. Shake device to open dev menu
2. Select "Debug Remote JS"
3. Open Chrome DevTools at `http://localhost:8081/debugger-ui`

## Performance

- Images optimized with Expo Image (WebP, caching)
- Infinite scroll with pagination
- React Query caching (5min stale time)
- Lazy loading for large lists
- Memoized components where needed

## Deployment

The app can be deployed via:
- **Expo Application Services (EAS)**: Managed builds
- **TestFlight**: iOS beta testing
- **Google Play**: Android beta/production
- **Over-the-air updates**: Expo Updates for instant patches

## License

Proprietary - Encore App

## Support

For issues or questions, contact: support@encore.app
