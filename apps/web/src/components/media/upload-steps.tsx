'use client';

interface UploadStep {
  id: string;
  label: string;
  description: string;
}

const UPLOAD_STEPS: UploadStep[] = [
  { id: 'select', label: 'Select Files', description: 'Choose photos and videos' },
  { id: 'upload', label: 'Upload', description: 'Upload to cloud' },
  { id: 'review', label: 'Review', description: 'Verify AI results' },
];

interface UploadStepsProps {
  currentStep: 'select' | 'upload' | 'review' | 'complete';
}

/**
 * Step indicator for the upload flow
 * Shows progress through select → upload → review → complete
 */
export function UploadSteps({ currentStep }: UploadStepsProps) {
  const getCurrentStepIndex = () => {
    if (currentStep === 'complete') return 3;
    return UPLOAD_STEPS.findIndex(s => s.id === currentStep);
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="mb-8">
      <nav aria-label="Upload progress">
        <ol className="flex items-center justify-between">
          {UPLOAD_STEPS.map((step, index) => {
            const isComplete = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <li key={step.id} className="flex-1 relative">
                {/* Connector line */}
                {index > 0 && (
                  <div
                    className={`absolute top-5 left-0 w-full h-0.5 -translate-x-1/2 transition-colors duration-300 ${
                      isComplete ? 'bg-primary-600' : 'bg-gray-200 dark:bg-slate-700'
                    }`}
                    style={{ width: 'calc(100% - 2.5rem)', left: 'calc(-50% + 1.25rem)' }}
                  />
                )}

                <div className="flex flex-col items-center relative">
                  {/* Circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isComplete
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : isCurrent
                          ? 'bg-white dark:bg-slate-800 border-primary-600 text-primary-600'
                          : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500'
                    }`}
                  >
                    {isComplete ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-2 text-center">
                    <p
                      className={`text-sm font-medium transition-colors ${
                        isComplete || isCurrent
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p
                      className={`text-xs mt-0.5 hidden sm:block transition-colors ${
                        isCurrent
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
