'use client';

import { ReactNode, forwardRef, InputHTMLAttributes, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  CheckIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

// ============================================
// FORM FIELD WRAPPER (for consistent spacing)
// ============================================
interface FormFieldProps {
  children: ReactNode;
  className?: string;
}

export function FormField({ children, className }: FormFieldProps) {
  return <div className={cn('space-y-1.5', className)}>{children}</div>;
}

// ============================================
// FORM LABEL
// ============================================
interface FormLabelProps {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  hint?: string;
}

export function FormLabel({ htmlFor, required, children, className, hint }: FormLabelProps) {
  return (
    <div className="flex items-center justify-between">
      <label
        htmlFor={htmlFor}
        className={cn('block text-sm font-medium text-dark-300', className)}
      >
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {hint && (
        <span className="text-xs text-dark-500">{hint}</span>
      )}
    </div>
  );
}

// ============================================
// FORM ERROR MESSAGE
// ============================================
interface FormErrorProps {
  message?: string;
  className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -5, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -5, height: 0 }}
          transition={{ duration: 0.15 }}
          className={cn('flex items-center gap-1.5 text-sm text-red-500', className)}
        >
          <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// FORM HELPER TEXT
// ============================================
interface FormHelperProps {
  children: ReactNode;
  className?: string;
}

export function FormHelper({ children, className }: FormHelperProps) {
  return (
    <p className={cn('text-sm text-dark-400', className)}>
      {children}
    </p>
  );
}

// ============================================
// CHECKBOX COMPONENT
// ============================================
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: string;
  error?: string;
  containerClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, containerClassName, className, id, ...props }, ref) => {
    const checkboxId = id || props.name;

    return (
      <div className={cn('relative', containerClassName)}>
        <label
          htmlFor={checkboxId}
          className={cn(
            'flex items-start gap-3 cursor-pointer group',
            props.disabled && 'cursor-not-allowed opacity-60'
          )}
        >
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              className={cn(
                'peer sr-only',
                className
              )}
              {...props}
            />
            <motion.div
              whileHover={!props.disabled ? { scale: 1.05 } : undefined}
              whileTap={!props.disabled ? { scale: 0.95 } : undefined}
              className={cn(
                'w-5 h-5 rounded border-2 transition-all duration-fast',
                'flex items-center justify-center',
                'peer-checked:bg-primary-500 peer-checked:border-primary-500',
                'peer-focus:ring-2 peer-focus:ring-primary-500/50',
                error
                  ? 'border-red-500'
                  : 'border-dark-500 group-hover:border-dark-400'
              )}
            >
              <motion.div
                initial={false}
                animate={{ scale: props.checked ? 1 : 0 }}
                transition={{ duration: 0.1 }}
              >
                <CheckIcon className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </motion.div>
            </motion.div>
          </div>
          <div className="flex-1">
            {label && (
              <span className="text-sm font-medium text-white">{label}</span>
            )}
            {description && (
              <p className="text-sm text-dark-400 mt-0.5">{description}</p>
            )}
          </div>
        </label>
        <FormError message={error} className="mt-1.5 ml-8" />
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// ============================================
// RADIO GROUP COMPONENT
// ============================================
interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: RadioOption[];
  label?: string;
  error?: string;
  required?: boolean;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  label,
  error,
  required,
  direction = 'vertical',
  className,
}: RadioGroupProps) {
  return (
    <div className={className}>
      {label && (
        <FormLabel required={required} className="mb-3">
          {label}
        </FormLabel>
      )}
      <div
        className={cn(
          'flex gap-3',
          direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
        )}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex items-start gap-3 cursor-pointer group',
              option.disabled && 'cursor-not-allowed opacity-60'
            )}
          >
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange?.(option.value)}
                disabled={option.disabled}
                className="peer sr-only"
              />
              <motion.div
                whileHover={!option.disabled ? { scale: 1.05 } : undefined}
                whileTap={!option.disabled ? { scale: 0.95 } : undefined}
                className={cn(
                  'w-5 h-5 rounded-full border-2 transition-all duration-fast',
                  'flex items-center justify-center',
                  'peer-checked:border-primary-500',
                  'peer-focus:ring-2 peer-focus:ring-primary-500/50',
                  error
                    ? 'border-red-500'
                    : 'border-dark-500 group-hover:border-dark-400'
                )}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: value === option.value ? 1 : 0,
                  }}
                  transition={{ duration: 0.15 }}
                  className="w-2.5 h-2.5 rounded-full bg-primary-500"
                />
              </motion.div>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-white">{option.label}</span>
              {option.description && (
                <p className="text-sm text-dark-400 mt-0.5">{option.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>
      <FormError message={error} className="mt-2" />
    </div>
  );
}

// ============================================
// SWITCH / TOGGLE COMPONENT
// ============================================
interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: ReactNode;
  description?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  containerClassName?: string;
}

const switchSizes = {
  sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
  md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
  lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' },
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, error, size = 'md', containerClassName, className, id, checked, ...props }, ref) => {
    const switchId = id || props.name;
    const sizeClasses = switchSizes[size];

    return (
      <div className={cn('relative', containerClassName)}>
        <label
          htmlFor={switchId}
          className={cn(
            'flex items-center justify-between gap-3 cursor-pointer group',
            props.disabled && 'cursor-not-allowed opacity-60'
          )}
        >
          <div className="flex-1">
            {label && (
              <span className="text-sm font-medium text-white">{label}</span>
            )}
            {description && (
              <p className="text-sm text-dark-400 mt-0.5">{description}</p>
            )}
          </div>
          <div className="relative flex-shrink-0">
            <input
              ref={ref}
              type="checkbox"
              id={switchId}
              checked={checked}
              className="peer sr-only"
              {...props}
            />
            <motion.div
              className={cn(
                sizeClasses.track,
                'rounded-full transition-colors duration-fast',
                'peer-checked:bg-primary-500',
                'peer-focus:ring-2 peer-focus:ring-primary-500/50 peer-focus:ring-offset-2 peer-focus:ring-offset-dark-900',
                error ? 'bg-red-500/30' : 'bg-dark-600'
              )}
            />
            <motion.div
              className={cn(
                sizeClasses.thumb,
                'absolute top-0.5 left-0.5 rounded-full bg-white shadow-md',
                'transition-transform duration-fast',
                checked && sizeClasses.translate
              )}
            />
          </div>
        </label>
        <FormError message={error} className="mt-1.5" />
      </div>
    );
  }
);

Switch.displayName = 'Switch';

// ============================================
// PASSWORD INPUT WITH TOGGLE
// ============================================
interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  showStrength?: boolean;
  containerClassName?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, helperText, showStrength, containerClassName, className, id, required, value, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || props.name;

    // Calculate password strength
    const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
      if (!password) return { score: 0, label: '', color: 'bg-dark-600' };

      let score = 0;
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
      if (/\d/.test(password)) score++;
      if (/[^a-zA-Z0-9]/.test(password)) score++;

      if (score <= 1) return { score, label: 'Fraca', color: 'bg-red-500' };
      if (score <= 2) return { score, label: 'Regular', color: 'bg-orange-500' };
      if (score <= 3) return { score, label: 'Boa', color: 'bg-yellow-500' };
      if (score <= 4) return { score, label: 'Forte', color: 'bg-green-500' };
      return { score, label: 'Muito forte', color: 'bg-green-600' };
    };

    const strength = showStrength ? getPasswordStrength(String(value || '')) : null;

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <FormLabel htmlFor={inputId} required={required}>
            {label}
          </FormLabel>
        )}
        <div className="relative mt-1">
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            id={inputId}
            required={required}
            value={value}
            className={cn(
              'w-full px-4 py-2 pr-12 rounded-lg bg-dark-800 border text-white placeholder-dark-400',
              'transition-all duration-fast',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error ? 'border-red-500 focus:ring-red-500' : 'border-dark-600',
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Password strength indicator */}
        {showStrength && value && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2"
          >
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'h-1 flex-1 rounded-full origin-left',
                    i <= (strength?.score || 0) ? strength?.color : 'bg-dark-600'
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-dark-400">
              Força: <span className={cn('font-medium', strength?.color.replace('bg-', 'text-'))}>{strength?.label}</span>
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {error ? (
            <FormError message={error} className="mt-1.5" />
          ) : helperText ? (
            <FormHelper className="mt-1.5">{helperText}</FormHelper>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

// ============================================
// CHARACTER COUNTER FOR TEXTAREA
// ============================================
interface CharacterCounterProps {
  current: number;
  max: number;
  showWarningAt?: number; // percentage (0-100)
}

export function CharacterCounter({ current, max, showWarningAt = 80 }: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isWarning = percentage >= showWarningAt;
  const isError = current > max;

  return (
    <motion.span
      animate={{
        color: isError ? '#ef4444' : isWarning ? '#f59e0b' : '#64748b',
      }}
      className="text-sm"
    >
      {current}/{max}
    </motion.span>
  );
}

// ============================================
// INPUT WITH VALIDATION STATUS
// ============================================
interface ValidatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isValid?: boolean;
  isValidating?: boolean;
  containerClassName?: string;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ label, error, helperText, isValid, isValidating, containerClassName, className, id, required, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <FormLabel htmlFor={inputId} required={required}>
            {label}
          </FormLabel>
        )}
        <div className="relative mt-1">
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={cn(
              'w-full px-4 py-2 pr-10 rounded-lg bg-dark-800 border text-white placeholder-dark-400',
              'transition-all duration-fast',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error ? 'border-red-500 focus:ring-red-500' :
              isValid ? 'border-green-500 focus:ring-green-500' : 'border-dark-600',
              className
            )}
            {...props}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AnimatePresence mode="wait">
              {isValidating ? (
                <motion.div
                  key="validating"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"
                />
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
                </motion.div>
              ) : isValid ? (
                <motion.div
                  key="valid"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <CheckIcon className="w-5 h-5 text-green-500" />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {error ? (
            <FormError message={error} className="mt-1.5" />
          ) : helperText ? (
            <FormHelper className="mt-1.5">{helperText}</FormHelper>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';
