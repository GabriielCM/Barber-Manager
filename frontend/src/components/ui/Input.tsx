'use client';

import { forwardRef, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================
// INPUT COMPONENT
// ============================================
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerClassName,
      className,
      id,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-dark-300 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={cn(
              'w-full px-4 py-2 rounded-lg bg-dark-800 border text-white placeholder-dark-400',
              'transition-all duration-fast',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error ? 'border-red-500 focus:ring-red-500' : 'border-dark-600',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input';

// ============================================
// TEXTAREA COMPONENT
// ============================================
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      containerClassName,
      className,
      id,
      required,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const textareaId = id || props.name;

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-dark-300 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          rows={rows}
          className={cn(
            'w-full px-4 py-3 rounded-lg bg-dark-800 border text-white placeholder-dark-400 resize-none',
            'transition-all duration-fast',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            error ? 'border-red-500 focus:ring-red-500' : 'border-dark-600',
            className
          )}
          {...props}
        />
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

Textarea.displayName = 'Textarea';

// ============================================
// SEARCH INPUT COMPONENT
// ============================================
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
  containerClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, containerClassName, className, value, ...props }, ref) => {
    const hasValue = value && String(value).length > 0;

    return (
      <div className={cn('relative', containerClassName)}>
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          className={cn(
            'w-full pl-10 pr-10 py-2 rounded-lg bg-dark-800 border border-dark-600',
            'text-white placeholder-dark-400',
            'transition-all duration-fast',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            className
          )}
          {...props}
        />
        <AnimatePresence>
          {hasValue && onClear && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              type="button"
              onClick={onClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
