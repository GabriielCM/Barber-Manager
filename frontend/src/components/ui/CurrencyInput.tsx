'use client';

import { forwardRef, InputHTMLAttributes, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FormLabel, FormError, FormHelper } from './FormField';

// ============================================
// CURRENCY INPUT COMPONENT
// ============================================
interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: number | string;
  onChange?: (value: number) => void;
  currency?: string;
  locale?: string;
  showCurrencySymbol?: boolean;
  allowNegative?: boolean;
  decimalPlaces?: number;
  containerClassName?: string;
}

const formatCurrency = (
  value: number,
  locale: string = 'pt-BR',
  currency: string = 'BRL',
  decimalPlaces: number = 2
): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
};

const parseCurrencyValue = (value: string, decimalPlaces: number = 2): number => {
  // Remove all non-numeric characters except minus
  const cleanValue = value.replace(/[^\d-]/g, '');
  const number = parseInt(cleanValue, 10) || 0;
  return number / Math.pow(10, decimalPlaces);
};

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      label,
      error,
      helperText,
      value = 0,
      onChange,
      currency = 'BRL',
      locale = 'pt-BR',
      showCurrencySymbol = true,
      allowNegative = false,
      decimalPlaces = 2,
      containerClassName,
      className,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    const [displayValue, setDisplayValue] = useState(formatCurrency(numericValue, locale, currency, decimalPlaces));
    const [isFocused, setIsFocused] = useState(false);

    // Update display value when external value changes
    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatCurrency(numericValue, locale, currency, decimalPlaces));
      }
    }, [numericValue, locale, currency, decimalPlaces, isFocused]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow only numbers and formatting characters
      const cleanInput = inputValue.replace(/[^\d,.-]/g, '');

      // Parse and format
      const parsed = parseCurrencyValue(cleanInput, decimalPlaces);

      // Check for negative values
      if (!allowNegative && parsed < 0) {
        return;
      }

      setDisplayValue(formatCurrency(parsed, locale, currency, decimalPlaces));
      onChange?.(parsed);
    }, [allowNegative, decimalPlaces, locale, currency, onChange]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Select all text on focus for easy editing
      e.target.select();
    };

    const handleBlur = () => {
      setIsFocused(false);
      setDisplayValue(formatCurrency(numericValue, locale, currency, decimalPlaces));
    };

    const currencySymbol = showCurrencySymbol
      ? new Intl.NumberFormat(locale, { style: 'currency', currency })
          .formatToParts(0)
          .find(part => part.type === 'currency')?.value || 'R$'
      : null;

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <FormLabel htmlFor={inputId} required={required}>
            {label}
          </FormLabel>
        )}
        <div className="relative mt-1">
          {currencySymbol && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none font-medium">
              {currencySymbol}
            </div>
          )}
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            id={inputId}
            required={required}
            disabled={disabled}
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              'w-full px-4 py-2 rounded-lg bg-dark-800 border text-white placeholder-dark-400 text-right',
              'transition-all duration-fast',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error ? 'border-red-500 focus:ring-red-500' : 'border-dark-600',
              currencySymbol && 'pl-12',
              disabled && 'opacity-60 cursor-not-allowed',
              className
            )}
            {...props}
          />
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

CurrencyInput.displayName = 'CurrencyInput';

// ============================================
// PERCENTAGE INPUT COMPONENT
// ============================================
interface PercentageInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  decimalPlaces?: number;
  containerClassName?: string;
}

export const PercentageInput = forwardRef<HTMLInputElement, PercentageInputProps>(
  (
    {
      label,
      error,
      helperText,
      value = 0,
      onChange,
      min = 0,
      max = 100,
      decimalPlaces = 0,
      containerClassName,
      className,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;
    const [displayValue, setDisplayValue] = useState(value.toFixed(decimalPlaces));

    useEffect(() => {
      setDisplayValue(value.toFixed(decimalPlaces));
    }, [value, decimalPlaces]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.replace(/[^\d.,]/g, '');
      setDisplayValue(inputValue);

      const parsed = parseFloat(inputValue.replace(',', '.')) || 0;
      const clamped = Math.min(Math.max(parsed, min), max);
      onChange?.(clamped);
    };

    const handleBlur = () => {
      const parsed = parseFloat(displayValue.replace(',', '.')) || 0;
      const clamped = Math.min(Math.max(parsed, min), max);
      setDisplayValue(clamped.toFixed(decimalPlaces));
      onChange?.(clamped);
    };

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
            type="text"
            inputMode="decimal"
            id={inputId}
            required={required}
            disabled={disabled}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              'w-full px-4 py-2 pr-10 rounded-lg bg-dark-800 border text-white placeholder-dark-400 text-right',
              'transition-all duration-fast',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error ? 'border-red-500 focus:ring-red-500' : 'border-dark-600',
              disabled && 'opacity-60 cursor-not-allowed',
              className
            )}
            {...props}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none font-medium">
            %
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

PercentageInput.displayName = 'PercentageInput';

// ============================================
// NUMBER INPUT WITH STEPPER
// ============================================
interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showStepper?: boolean;
  suffix?: string;
  containerClassName?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      label,
      error,
      helperText,
      value = 0,
      onChange,
      min,
      max,
      step = 1,
      showStepper = true,
      suffix,
      containerClassName,
      className,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value) || 0;
      const clampedValue = clampValue(newValue);
      onChange?.(clampedValue);
    };

    const clampValue = (val: number): number => {
      let result = val;
      if (min !== undefined) result = Math.max(result, min);
      if (max !== undefined) result = Math.min(result, max);
      return result;
    };

    const increment = () => {
      if (disabled) return;
      const newValue = clampValue(value + step);
      onChange?.(newValue);
    };

    const decrement = () => {
      if (disabled) return;
      const newValue = clampValue(value - step);
      onChange?.(newValue);
    };

    const canIncrement = max === undefined || value < max;
    const canDecrement = min === undefined || value > min;

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <FormLabel htmlFor={inputId} required={required}>
            {label}
          </FormLabel>
        )}
        <div className="relative mt-1 flex">
          {showStepper && (
            <motion.button
              type="button"
              whileHover={canDecrement && !disabled ? { scale: 1.05 } : undefined}
              whileTap={canDecrement && !disabled ? { scale: 0.95 } : undefined}
              onClick={decrement}
              disabled={disabled || !canDecrement}
              className={cn(
                'px-3 py-2 bg-dark-700 border border-dark-600 border-r-0 rounded-l-lg',
                'text-white font-bold transition-colors',
                'hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              -
            </motion.button>
          )}
          <div className="relative flex-1">
            <input
              ref={ref}
              type="number"
              inputMode="numeric"
              id={inputId}
              required={required}
              disabled={disabled}
              value={value}
              onChange={handleChange}
              min={min}
              max={max}
              step={step}
              className={cn(
                'w-full px-4 py-2 bg-dark-800 border text-white placeholder-dark-400 text-center',
                'transition-all duration-fast',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                error ? 'border-red-500 focus:ring-red-500' : 'border-dark-600',
                showStepper ? 'rounded-none' : 'rounded-lg',
                suffix && 'pr-12',
                disabled && 'opacity-60 cursor-not-allowed',
                className
              )}
              {...props}
            />
            {suffix && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none">
                {suffix}
              </div>
            )}
          </div>
          {showStepper && (
            <motion.button
              type="button"
              whileHover={canIncrement && !disabled ? { scale: 1.05 } : undefined}
              whileTap={canIncrement && !disabled ? { scale: 0.95 } : undefined}
              onClick={increment}
              disabled={disabled || !canIncrement}
              className={cn(
                'px-3 py-2 bg-dark-700 border border-dark-600 border-l-0 rounded-r-lg',
                'text-white font-bold transition-colors',
                'hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              +
            </motion.button>
          )}
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

NumberInput.displayName = 'NumberInput';
