'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useUploadUrl, useCreateMedia, useAnalyzeMedia } from '@/lib/api/hooks/use-media';
import { useUserStats } from '@/lib/api/hooks/use-user';
import { UploadDropzone } from '@/components/media/upload-dropzone';
import { UploadReview } from '@/components/media/upload-review';
import { UpgradeModal } from '@/components/modals/upgrade-modal';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

const FREE_PHOTO_LIMIT = 25;

interface FileWithPreview extends File {
  preview?: string;
  uploadProgress?: number;
  uploadComplete?: boolean;
  uploadError?: string;
  mediaId?: string;
}

/**
 * Media Upload Page
 *
 * Allows users to upload photos and videos with:
 * - Drag and drop interface
 * - File picker fallback
 * - Progress indicators for each file
 * - Preview before upload
 * - Optional AI analysis
 * - Batch upload support
 */
export default function MediaUploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [analyzeWithAI, setAnalyzeWithAI] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isAddingFiles, startTransition] = useTransition();
  const [showReview, setShowReview] = useState(false);
  const [uploadedMediaIds, setUploadedMediaIds] = useState<string[]>([]);

  const { data: userStats } = useUserStats();
  const uploadUrlMutation = useUploadUrl();
  const createMediaMutation = useCreateMedia();
  const analyzeMediaMutation = useAnalyzeMedia();

  // TODO: Get from user subscription status when implemented
  const isPremium = false;
  const currentPhotoCount = userStats?.totalMedia ?? 0;

  /**
   * Handle files selected from dropzone or file picker
   * Uses startTransition to keep UI responsive during large batch adds
   */
  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    const filesWithPreview = selectedFiles.map(file => {
      const fileWithPreview = file as FileWithPreview;

      // Create preview URL for images (videos show placeholder icon)
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }

      fileWithPreview.uploadProgress = 0;
      fileWithPreview.uploadComplete = false;

      return fileWithPreview;
    });

    // Use transition to keep UI responsive during state update
    startTransition(() => {
      setFiles(prev => [...prev, ...filesWithPreview]);
    });
  }, []);

  /**
   * Remove a file from the upload queue
   */
  const handleRemoveFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const removed = newFiles.splice(index, 1)[0];

      // Revoke preview URL to prevent memory leak
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }

      return newFiles;
    });
  };

  /**
   * Upload a single file to S3 and create media record
   */
  const uploadFile = async (file: FileWithPreview, index: number): Promise<void> => {
    try {
      // Step 1: Get presigned upload URL
      const { uploadUrl, storagePath } = await uploadUrlMutation.mutateAsync({
        contentType: file.type,
        filename: file.name,
      });

      // Step 2: Upload to S3 with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setFiles(prev => {
              const updated = [...prev];
              updated[index].uploadProgress = progress;
              return updated;
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      // Step 3: Create media record
      const mediaType = file.type.startsWith('video/') ? 'video' : 'photo';
      const media = await createMediaMutation.mutateAsync({
        mediaType,
        storagePath,
        originalFilename: file.name,
      });

      setFiles(prev => {
        const updated = [...prev];
        updated[index].uploadComplete = true;
        updated[index].mediaId = media.id;
        return updated;
      });

      // Step 4: Optionally analyze with AI
      if (analyzeWithAI && media.id) {
        await analyzeMediaMutation.mutateAsync(media.id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setFiles(prev => {
        const updated = [...prev];
        updated[index].uploadError = errorMessage;
        return updated;
      });
      throw error;
    }
  };

  /**
   * Upload all files in the queue
   */
  const handleUploadAll = async () => {
    if (files.length === 0) return;

    // Check photo limit for free users
    const pendingFiles = files.filter(f => !f.uploadComplete && !f.uploadError);

    if (!isPremium && (currentPhotoCount + pendingFiles.length) > FREE_PHOTO_LIMIT) {
      setShowUpgradeModal(true);
      return;
    }

    setIsUploading(true);

    const newMediaIds: string[] = [];

    try {
      // Upload files sequentially (could be parallel with Promise.all)
      for (let i = 0; i < files.length; i++) {
        if (!files[i].uploadComplete && !files[i].uploadError) {
          await uploadFile(files[i], i);
          // Collect media ID after successful upload
          if (files[i].mediaId) {
            newMediaIds.push(files[i].mediaId!);
          }
        }
      }

      // If we have uploaded media with AI analysis, show review flow
      if (newMediaIds.length > 0 && analyzeWithAI) {
        setUploadedMediaIds(prev => [...prev, ...newMediaIds]);
        setShowReview(true);
      } else if (newMediaIds.length > 0) {
        // No AI analysis, go straight to gallery
        router.push('/media');
      }
    } catch (error) {
      console.error('Upload error:', error);
      // Still show review for successful uploads
      if (newMediaIds.length > 0 && analyzeWithAI) {
        setUploadedMediaIds(prev => [...prev, ...newMediaIds]);
        setShowReview(true);
      }
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Clear all completed uploads
   */
  const handleClearCompleted = () => {
    setFiles(prev => {
      const remaining = prev.filter(f => !f.uploadComplete);
      const completed = prev.filter(f => f.uploadComplete);

      // Revoke preview URLs
      completed.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });

      return remaining;
    });
  };

  const hasFiles = files.length > 0;
  const completedCount = files.filter(f => f.uploadComplete).length;
  const errorCount = files.filter(f => f.uploadError).length;
  const pendingCount = files.length - completedCount - errorCount;

  // Calculate remaining uploads for free tier
  const remainingUploads = Math.max(0, FREE_PHOTO_LIMIT - currentPhotoCount);
  const uploadsAfterQueue = Math.max(0, remainingUploads - pendingCount);
  const isNearLimit = remainingUploads <= 5 && remainingUploads > 0;
  const isAtLimit = remainingUploads === 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/media')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Media
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">Upload Media</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Add photos and videos from your concerts
          </p>
        </div>

        {/* Free Tier Usage Banner - Prominent at top */}
        {!isPremium && (
          <div className={`mb-6 rounded-xl border p-4 ${
            isAtLimit
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : isNearLimit
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isAtLimit
                    ? 'bg-red-100 dark:bg-red-900'
                    : isNearLimit
                      ? 'bg-yellow-100 dark:bg-yellow-900'
                      : 'bg-primary-100 dark:bg-primary-900'
                }`}>
                  <svg className={`w-5 h-5 ${
                    isAtLimit
                      ? 'text-red-600 dark:text-red-400'
                      : isNearLimit
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-primary-600 dark:text-primary-400'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className={`font-semibold ${
                    isAtLimit
                      ? 'text-red-900 dark:text-red-100'
                      : isNearLimit
                        ? 'text-yellow-900 dark:text-yellow-100'
                        : 'text-primary-900 dark:text-primary-100'
                  }`}>
                    {isAtLimit
                      ? 'Monthly limit reached'
                      : `${remainingUploads} upload${remainingUploads !== 1 ? 's' : ''} remaining`
                    }
                  </p>
                  <p className={`text-sm ${
                    isAtLimit
                      ? 'text-red-700 dark:text-red-300'
                      : isNearLimit
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : 'text-primary-700 dark:text-primary-300'
                  }`}>
                    {isAtLimit
                      ? 'Upgrade to Premium for unlimited uploads'
                      : `${currentPhotoCount} of ${FREE_PHOTO_LIMIT} used this month`
                    }
                  </p>
                </div>
              </div>
              {(isAtLimit || isNearLimit) && (
                <Button
                  variant={isAtLimit ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => router.push('/pricing')}
                >
                  {isAtLimit ? 'Upgrade Now' : 'Go Unlimited'}
                </Button>
              )}
            </div>
            {/* Progress bar */}
            <div className="mt-3">
              <div className="w-full bg-white dark:bg-slate-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isAtLimit
                      ? 'bg-red-500'
                      : isNearLimit
                        ? 'bg-yellow-500'
                        : 'bg-primary-600'
                  }`}
                  style={{ width: `${Math.min((currentPhotoCount / FREE_PHOTO_LIMIT) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Upload Zone */}
        {!hasFiles && (
          <UploadDropzone onFilesSelected={handleFilesSelected} />
        )}

        {/* File List */}
        {hasFiles && (
          <Card className="mb-6">
            <CardHeader actions={
              <div className="flex items-center gap-3">
                {completedCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCompleted}
                  >
                    Clear Completed
                  </Button>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analyzeWithAI}
                    onChange={(e) => setAnalyzeWithAI(e.target.checked)}
                    className="rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 dark:bg-slate-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Analyze with AI</span>
                </label>
              </div>
            }>
              <CardTitle>
                Upload Queue ({files.length}){isAddingFiles && ' ...'}
              </CardTitle>
              <div className="flex gap-2 mt-2">
                {pendingCount > 0 && <Badge variant="default">{pendingCount} pending</Badge>}
                {completedCount > 0 && <Badge variant="success">{completedCount} completed</Badge>}
                {errorCount > 0 && <Badge variant="error">{errorCount} failed</Badge>}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                  >
                    {/* Preview/Icon */}
                    <div className="flex-shrink-0 h-16 w-16 bg-gray-200 dark:bg-slate-700 rounded overflow-hidden">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>

                      {/* Progress Bar */}
                      {!file.uploadComplete && !file.uploadError && file.uploadProgress !== undefined && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${file.uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {file.uploadProgress}%
                          </p>
                        </div>
                      )}

                      {/* Error Message */}
                      {file.uploadError && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {file.uploadError}
                        </p>
                      )}
                    </div>

                    {/* Status/Actions */}
                    <div className="flex-shrink-0">
                      {file.uploadComplete ? (
                        <Badge variant="success">Complete</Badge>
                      ) : file.uploadError ? (
                        <Badge variant="error">Failed</Badge>
                      ) : isUploading ? (
                        <Spinner size="sm" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add More Files */}
              {!isUploading && (
                <div className="mt-4">
                  <UploadDropzone
                    onFilesSelected={handleFilesSelected}
                    compact
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload Button */}
        {hasFiles && pendingCount > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ready to upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}
              {!isPremium && pendingCount > 0 && (
                <span className="text-gray-400 dark:text-gray-500">
                  {' '}({uploadsAfterQueue} remaining after)
                </span>
              )}
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleUploadAll}
              loading={isUploading}
              disabled={isUploading}
            >
              Upload {pendingCount} File{pendingCount !== 1 ? 's' : ''}
            </Button>
          </div>
        )}

        {/* Post-upload Review Flow */}
        {showReview && uploadedMediaIds.length > 0 && (
          <UploadReview
            mediaIds={uploadedMediaIds}
            onComplete={() => router.push('/media')}
          />
        )}

        {/* Success Message (only if not showing review) */}
        {!showReview && completedCount > 0 && pendingCount === 0 && errorCount === 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
            <svg className="h-12 w-12 text-green-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Upload Complete!</h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Successfully uploaded {completedCount} file{completedCount !== 1 ? 's' : ''}
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/media')}
              className="mt-4"
            >
              View Media Gallery
            </Button>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        photosUsed={currentPhotoCount}
        photoLimit={FREE_PHOTO_LIMIT}
      />
    </div>
  );
}
