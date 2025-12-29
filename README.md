# Encore

> AI-powered concert memory app that automatically organizes your concert history through intelligent photo analysis

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)
![React Native](https://img.shields.io/badge/React%20Native-0.74-61dafb?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?style=flat&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat&logo=postgresql)
![AWS](https://img.shields.io/badge/AWS-S3%20%7C%20Cognito-FF9900?style=flat&logo=amazonaws)

## Overview

Encore transforms concert photos into an organized timeline of your live music memories. Upload a photo from a show, and our AI instantly identifies the artist, venue, and date—no manual entry required. Available on web, iOS, and Android.

### Key Features

- **AI Photo Analysis** - Claude-powered recognition of artists, venues, and dates (98% accuracy)
- **Automatic Timeline** - Build your concert history effortlessly
- **Cross-Platform** - Seamless sync between web and mobile apps
- **Setlist Integration** - View setlists from Setlist.fm
- **Statistics Dashboard** - Track artists, venues, and concert trends
- **Media Gallery** - Unlimited photo and video storage (premium)

## Tech Stack

### Web App
- **Framework:** Next.js 14 (App Router)
- **UI:** React 18, TypeScript, Tailwind CSS
- **State:** TanStack Query (React Query)
- **Auth:** AWS Cognito + Amplify

### Mobile App
- **Framework:** React Native + Expo SDK 51
- **Navigation:** Expo Router (file-based)
- **State:** TanStack Query + Zustand
- **Auth:** AWS Cognito

### Backend
- **API:** Express.js + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Storage:** AWS S3
- **AI:** Anthropic Claude API
- **Auth:** AWS Cognito + JWT

## Project Structure

```
encore/
├── apps/
│   ├── web/              # Next.js web application
│   ├── mobile/           # React Native mobile app (Expo)
│   └── api/              # Express.js backend API
├── packages/
│   └── shared/           # Shared TypeScript types & utilities
└── db/                   # Database migrations & schema
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+
- AWS Account (Cognito, S3)
- Claude API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/encore.git
cd encore

# Install dependencies
npm install
```

### Environment Setup

**Web App** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
```

**Mobile App** (`apps/mobile/.env`):
```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
EXPO_PUBLIC_COGNITO_USER_POOL_ID=your-user-pool-id
EXPO_PUBLIC_COGNITO_CLIENT_ID=your-client-id
EXPO_PUBLIC_COGNITO_REGION=us-east-1
```

**API** (`apps/api/.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/encore
JWT_SECRET=your-jwt-secret
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=encore-media
CLAUDE_API_KEY=your-claude-api-key
```

### Development

Run all apps concurrently:
```bash
npm run dev
```

Or run individually:

```bash
# Web app (http://localhost:3000)
cd apps/web
npm run dev

# Mobile app
cd apps/mobile
npm start

# API (http://localhost:3001)
cd apps/api
npm run dev
```

### Building for Production

```bash
# Build all apps
npm run build

# Build specific app
cd apps/web && npm run build
cd apps/mobile && npm run build
cd apps/api && npm run build
```

## Deployment

- **Web:** Vercel (recommended for Next.js)
- **API:** Railway or AWS ECS Fargate
- **Mobile:** EAS Build + App Store/Google Play
- **Database:** Railway PostgreSQL or AWS RDS
- **Storage:** AWS S3 + CloudFront CDN

## Pricing

- **Free:** 25 photos/month with AI analysis
- **Premium:** $4.99/month - unlimited photos, advanced stats, priority processing

## Documentation

For detailed documentation, see [CLAUDE.md](./CLAUDE.md) - comprehensive guide for developers and AI coding agents.

## License

Private and proprietary. All rights reserved.

---

Built with ❤️ for music lovers
