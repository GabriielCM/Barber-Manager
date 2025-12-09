'use client';

import { ReactNode, createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckIcon } from '@heroicons/react/24/outline';

// ============================================
// TYPES
// ============================================
interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
}

interface FormStepsContextValue {
  steps: Step[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  completedSteps: Set<number>;
  markStepCompleted: (step: number) => void;
  markStepIncomplete: (step: number) => void;
}

// ============================================
// CONTEXT
// ============================================
const FormStepsContext = createContext<FormStepsContextValue | null>(null);

function useFormSteps() {
  const context = useContext(FormStepsContext);
  if (!context) {
    throw new Error('useFormSteps must be used within FormStepsProvider');
  }
  return context;
}

// ============================================
// PROVIDER
// ============================================
interface FormStepsProviderProps {
  steps: Step[];
  initialStep?: number;
  children: ReactNode;
  onStepChange?: (step: number) => void;
}

export function FormStepsProvider({
  steps,
  initialStep = 0,
  children,
  onStepChange,
}: FormStepsProviderProps) {
  const [currentStep, setCurrentStepState] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const setCurrentStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStepState(step);
      onStepChange?.(step);
    }
  }, [steps.length, onStepChange]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      markStepCompleted(currentStep);
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, steps.length, setCurrentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, setCurrentStep]);

  const markStepCompleted = useCallback((step: number) => {
    setCompletedSteps(prev => new Set([...Array.from(prev), step]));
  }, []);

  const markStepIncomplete = useCallback((step: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(step);
      return newSet;
    });
  }, []);

  const value: FormStepsContextValue = {
    steps,
    currentStep,
    setCurrentStep,
    nextStep,
    previousStep,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    completedSteps,
    markStepCompleted,
    markStepIncomplete,
  };

  return (
    <FormStepsContext.Provider value={value}>
      {children}
    </FormStepsContext.Provider>
  );
}

// ============================================
// STEPPER INDICATOR (Horizontal)
// ============================================
interface StepperIndicatorProps {
  className?: string;
  variant?: 'default' | 'compact' | 'numbered';
  clickable?: boolean;
}

export function StepperIndicator({
  className,
  variant = 'default',
  clickable = false,
}: StepperIndicatorProps) {
  const { steps, currentStep, setCurrentStep, completedSteps } = useFormSteps();

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStep;
          const isPast = index < currentStep;
          const isClickable = clickable && (isCompleted || index <= currentStep);

          return (
            <div
              key={step.id}
              className={cn(
                'flex items-center',
                index < steps.length - 1 && 'flex-1'
              )}
            >
              {/* Step Circle */}
              <motion.button
                type="button"
                onClick={() => isClickable && setCurrentStep(index)}
                disabled={!isClickable}
                whileHover={isClickable ? { scale: 1.1 } : undefined}
                whileTap={isClickable ? { scale: 0.95 } : undefined}
                className={cn(
                  'relative flex items-center justify-center rounded-full transition-colors',
                  variant === 'compact' ? 'w-8 h-8' : 'w-10 h-10',
                  (isCompleted || isCurrent) && 'bg-primary-500 text-white',
                  !isCompleted && !isCurrent && 'bg-dark-700 text-dark-400 border border-dark-600',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default'
                )}
              >
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <CheckIcon className="w-5 h-5" />
                    </motion.div>
                  ) : variant === 'numbered' || !step.icon ? (
                    <motion.span
                      key="number"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-medium"
                    >
                      {index + 1}
                    </motion.span>
                  ) : (
                    <motion.div
                      key="icon"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {step.icon}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Current step pulse */}
                {isCurrent && !isCompleted && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary-500/30"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>

              {/* Step Label */}
              {variant !== 'compact' && (
                <div className="ml-3 hidden sm:block">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCurrent && 'text-white',
                      !isCurrent && 'text-dark-400'
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-dark-500 mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
              )}

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4',
                    variant === 'compact' && 'mx-2'
                  )}
                >
                  <motion.div
                    className="h-full bg-dark-700 rounded-full overflow-hidden"
                  >
                    <motion.div
                      className="h-full bg-primary-500"
                      initial={{ width: '0%' }}
                      animate={{
                        width: isPast || isCompleted ? '100%' : isCurrent ? '50%' : '0%',
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Step Title */}
      {variant !== 'compact' && (
        <div className="mt-4 text-center sm:hidden">
          <p className="text-sm font-medium text-white">
            {steps[currentStep].title}
          </p>
          {steps[currentStep].description && (
            <p className="text-xs text-dark-400 mt-0.5">
              {steps[currentStep].description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// VERTICAL STEPPER
// ============================================
interface VerticalStepperProps {
  className?: string;
  clickable?: boolean;
}

export function VerticalStepper({
  className,
  clickable = false,
}: VerticalStepperProps) {
  const { steps, currentStep, setCurrentStep, completedSteps } = useFormSteps();

  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => {
        const isCompleted = completedSteps.has(index);
        const isCurrent = index === currentStep;
        const isClickable = clickable && (isCompleted || index <= currentStep);
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="relative">
            <div className="flex items-start gap-4">
              {/* Step Circle */}
              <div className="relative">
                <motion.button
                  type="button"
                  onClick={() => isClickable && setCurrentStep(index)}
                  disabled={!isClickable}
                  whileHover={isClickable ? { scale: 1.1 } : undefined}
                  whileTap={isClickable ? { scale: 0.95 } : undefined}
                  className={cn(
                    'relative flex items-center justify-center w-10 h-10 rounded-full transition-colors z-10',
                    (isCompleted || isCurrent) && 'bg-primary-500 text-white',
                    !isCompleted && !isCurrent && 'bg-dark-700 text-dark-400 border border-dark-600',
                    isClickable && 'cursor-pointer',
                    !isClickable && 'cursor-default'
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <CheckIcon className="w-5 h-5" />
                      </motion.div>
                    ) : step.icon ? (
                      <motion.div
                        key="icon"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {step.icon}
                      </motion.div>
                    ) : (
                      <motion.span
                        key="number"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm font-medium"
                      >
                        {index + 1}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Connector Line */}
                {!isLast && (
                  <div className="absolute left-1/2 top-10 w-0.5 h-8 -translate-x-1/2 bg-dark-700 overflow-hidden">
                    <motion.div
                      className="w-full bg-primary-500"
                      initial={{ height: '0%' }}
                      animate={{
                        height: isCompleted ? '100%' : '0%',
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-2">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isCurrent && 'text-white',
                    !isCurrent && 'text-dark-400'
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-dark-500 mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// PROGRESS BAR
// ============================================
interface StepProgressBarProps {
  className?: string;
  showPercentage?: boolean;
  showLabel?: boolean;
}

export function StepProgressBar({
  className,
  showPercentage = true,
  showLabel = true,
}: StepProgressBarProps) {
  const { steps, currentStep, completedSteps } = useFormSteps();
  const progress = ((currentStep + (completedSteps.has(currentStep) ? 1 : 0)) / steps.length) * 100;

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-dark-400">
            Etapa {currentStep + 1} de {steps.length}
          </span>
          {showPercentage && (
            <span className="text-sm font-medium text-primary-400">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-600 to-primary-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ============================================
// STEP CONTENT
// ============================================
interface StepContentProps {
  children: ReactNode | ((step: number) => ReactNode);
  className?: string;
}

export function StepContent({ children, className }: StepContentProps) {
  const { currentStep } = useFormSteps();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className={className}
      >
        {typeof children === 'function' ? children(currentStep) : children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// STEP NAVIGATION BUTTONS
// ============================================
interface StepNavigationProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onComplete?: () => void;
  previousLabel?: string;
  nextLabel?: string;
  completeLabel?: string;
  isNextDisabled?: boolean;
  isPreviousDisabled?: boolean;
  isCompleteLoading?: boolean;
  className?: string;
}

export function StepNavigation({
  onPrevious,
  onNext,
  onComplete,
  previousLabel = 'Voltar',
  nextLabel = 'Continuar',
  completeLabel = 'Concluir',
  isNextDisabled = false,
  isPreviousDisabled = false,
  isCompleteLoading = false,
  className,
}: StepNavigationProps) {
  const { isFirstStep, isLastStep, previousStep, nextStep } = useFormSteps();

  const handlePrevious = () => {
    onPrevious?.();
    previousStep();
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
    } else {
      onNext?.();
      nextStep();
    }
  };

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <motion.button
        type="button"
        onClick={handlePrevious}
        disabled={isFirstStep || isPreviousDisabled}
        whileHover={!isFirstStep && !isPreviousDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isFirstStep && !isPreviousDisabled ? { scale: 0.98 } : undefined}
        className={cn(
          'px-6 py-2 rounded-lg font-medium transition-colors',
          'bg-dark-700 text-white hover:bg-dark-600',
          (isFirstStep || isPreviousDisabled) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {previousLabel}
      </motion.button>

      <motion.button
        type="button"
        onClick={handleNext}
        disabled={isNextDisabled || isCompleteLoading}
        whileHover={!isNextDisabled && !isCompleteLoading ? { scale: 1.02 } : undefined}
        whileTap={!isNextDisabled && !isCompleteLoading ? { scale: 0.98 } : undefined}
        className={cn(
          'px-6 py-2 rounded-lg font-medium transition-colors',
          'bg-primary-500 text-white hover:bg-primary-600',
          (isNextDisabled || isCompleteLoading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isCompleteLoading ? (
          <motion.div
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : isLastStep ? (
          completeLabel
        ) : (
          nextLabel
        )}
      </motion.button>
    </div>
  );
}

// ============================================
// STEP PANEL (for conditional rendering)
// ============================================
interface StepPanelProps {
  stepIndex: number;
  children: ReactNode;
  className?: string;
}

export function StepPanel({ stepIndex, children, className }: StepPanelProps) {
  const { currentStep } = useFormSteps();

  if (currentStep !== stepIndex) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// EXPORTS
// ============================================
export { useFormSteps };
