import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Encore - AI-Powered Concert Memory',
    template: '%s | Encore',
  },
  description: 'Capture, relive, and share your concert experiences with AI-powered memories',
  keywords: ['concerts', 'music', 'memories', 'AI', 'events'],
  authors: [{ name: 'Encore Team' }],
  creator: 'Encore',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Encore - AI-Powered Concert Memory',
    description: 'Capture, relive, and share your concert experiences with AI-powered memories',
    siteName: 'Encore',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Encore - AI-Powered Concert Memory',
    description: 'Capture, relive, and share your concert experiences with AI-powered memories',
    creator: '@encore',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <Providers>
          <AuthProvider>
            {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
