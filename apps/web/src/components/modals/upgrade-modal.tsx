'use client';

import Link from 'next/link';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  photosUsed: number;
  photoLimit: number;
}

export function UpgradeModal({ isOpen, onClose, photosUsed, photoLimit }: UpgradeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      closeOnOverlayClick={false}
      size="md"
    >
      <div className="text-center py-4">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-primary-600 dark:text-primary-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Photo Limit Reached
        </h3>

        {/* Usage Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-full mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {photosUsed} / {photoLimit} photos used
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Upgrade to Premium for unlimited uploads and priority AI processing to keep building your concert memories.
        </p>

        {/* Premium Features */}
        <div className="bg-gradient-to-r from-primary-50 to-orange-50 dark:from-primary-950 dark:to-orange-950 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Premium includes:
          </p>
          <ul className="space-y-1.5">
            {[
              'Unlimited photo uploads',
              'Priority AI analysis',
              'Advanced concert statistics',
              'Export your data anytime',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/pricing"
            className="block w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
          >
            Upgrade to Premium - $4.99/mo
          </Link>
          <Button
            variant="ghost"
            onClick={onClose}
            fullWidth
          >
            Maybe Later
          </Button>
        </div>
      </div>
    </Modal>
  );
}
