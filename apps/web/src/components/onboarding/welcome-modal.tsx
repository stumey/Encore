'use client';

import Link from 'next/link';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

export interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Welcome Modal for new users
 *
 * Shown on first dashboard visit after signup.
 * Encourages users to upload their first concert photos.
 */
export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      closeOnOverlayClick={false}
      size="lg"
    >
      <div className="text-center py-6">
        {/* Icon/Logo */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Welcome to Encore!
        </h2>

        {/* Subtitle */}
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Let&apos;s relive your first concert memory together
        </p>

        {/* Features Preview */}
        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6 mb-8 text-left max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
            Here&apos;s how it works
          </h3>
          <ul className="space-y-3">
            {[
              { step: '1', text: 'Upload your concert photos' },
              { step: '2', text: 'Our AI identifies the artist, venue & date' },
              { step: '3', text: 'Build your concert history automatically' },
            ].map((item) => (
              <li key={item.step} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </span>
                <span className="text-gray-700 dark:text-gray-300">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 max-w-sm mx-auto">
          <Link
            href="/media/upload"
            onClick={onClose}
            className="block w-full px-6 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-lg rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Upload Concert Photos
          </Link>
          <Button
            variant="ghost"
            onClick={onClose}
            fullWidth
          >
            I&apos;ll explore first
          </Button>
        </div>

        {/* Trust Indicator */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
          98% AI accuracy • Your photos stay private
        </p>
      </div>
    </Modal>
  );
}
