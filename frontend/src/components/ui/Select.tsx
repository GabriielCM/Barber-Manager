'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

// ============================================
// SELECT COMPONENT
// ============================================
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder = 'Selecione...',
      containerClassName,
      className,
      id,
      required,
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name;

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-dark-300 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            required={required}
            className={cn(
              'w-full px-4 py-2 pr-10 rounded-lg bg-dark-800 border text-white',
              'appearance-none cursor-pointer',
              'transition-all duration-fast',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error ? 'border-red-500 focus:ring-red-500' : 'border-dark-600',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" className="text-dark-400 bg-dark-800">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="bg-dark-800"
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
        </div>
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="mt-1 text-sm text-red-500"
            >
              {error}
            </motion.p>
          ) : helperText ? (
            <motion.p
              key="helper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-1 text-sm text-dark-400"
            >
              {helperText}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

Select.displayName = 'Select';

// ============================================
// NATIVE SELECT (simpler version)
// ============================================
interface NativeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
}

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ options, placeholder, className, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'w-full px-4 py-2 pr-10 rounded-lg bg-dark-800 border border-dark-600 text-white',
            'appearance-none cursor-pointer',
            'transition-all duration-fast',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" className="text-dark-400 bg-dark-800">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="bg-dark-800"
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
      </div>
    );
  }
);

NativeSelect.displayName = 'NativeSelect';
