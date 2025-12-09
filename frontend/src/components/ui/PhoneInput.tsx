'use client';

import { forwardRef, InputHTMLAttributes, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FormLabel, FormError, FormHelper } from './FormField';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

// ============================================
// PHONE INPUT WITH BRAZILIAN MASK
// ============================================
interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: string;
  onChange?: (value: string, rawValue?: string) => void;
  showIcon?: boolean;
  containerClassName?: string;
}

// Format Brazilian phone: (00) 00000-0000 or (00) 0000-0000
const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');

  // Limit to 11 digits
  const limited = numbers.slice(0, 11);

  if (limited.length === 0) return '';
  if (limited.length <= 2) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  if (limited.length <= 10) {
    // Fixed phone: (00) 0000-0000
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  }
  // Mobile phone: (00) 00000-0000
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
};

// Get raw phone number (only digits)
const getRawPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      label,
      error,
      helperText,
      value = '',
      onChange,
      showIcon = true,
      containerClassName,
      className,
      id,
      required,
      disabled,
      placeholder = '(00) 00000-0000',
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;
    const [displayValue, setDisplayValue] = useState(formatPhoneNumber(value));

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = formatPhoneNumber(inputValue);
      const raw = getRawPhoneNumber(inputValue);

      setDisplayValue(formatted);
      onChange?.(raw, formatted);
    }, [onChange]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow navigation keys
      if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
        return;
      }

      // Block non-numeric input
      if (!/^\d$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
      }
    };

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <FormLabel htmlFor={inputId} required={required}>
            {label}
          </FormLabel>
        )}
        <div className="relative mt-1">
          {showIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none">
              <DevicePhoneMobileIcon className="w-5 h-5" />
            </div>
          )}
          <input
            ref={ref}
            type="tel"
            inputMode="tel"
            id={inputId}
            required={required}
            disabled={disabled}
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              'w-full px-4 py-2 rounded-lg bg-dark-800 border text-white placeholder-dark-400',
              'transition-all duration-fast',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error ? 'border-red-500 focus:ring-red-500' : 'border-dark-600',
              showIcon && 'pl-10',
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

PhoneInput.displayName = 'PhoneInput';

// ============================================
// CPF INPUT WITH MASK
// ============================================
interface CpfInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: string;
  onChange?: (value: string, rawValue?: string) => void;
  containerClassName?: string;
}

// Format CPF: 000.000.000-00
const formatCpf = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);

  if (numbers.length === 0) return '';
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
};

export const CpfInput = forwardRef<HTMLInputElement, CpfInputProps>(
  (
    {
      label,
      error,
      helperText,
      value = '',
      onChange,
      containerClassName,
      className,
      id,
      required,
      disabled,
      placeholder = '000.000.000-00',
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;
    const [displayValue, setDisplayValue] = useState(formatCpf(value));

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = formatCpf(inputValue);
      const raw = inputValue.replace(/\D/g, '');

      setDisplayValue(formatted);
      onChange?.(raw, formatted);
    }, [onChange]);

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
            inputMode="numeric"
            id={inputId}
            required={required}
            disabled={disabled}
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            maxLength={14}
            className={cn(
              'w-full px-4 py-2 rounded-lg bg-dark-800 border text-white placeholder-dark-400',
              'transition-all duration-fast',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error ? 'border-red-500 focus:ring-red-500' : 'border-dark-600',
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

CpfInput.displayName = 'CpfInput';

// ============================================
// CEP INPUT WITH MASK AND AUTO-FETCH
// ============================================
interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
}

interface CepInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: string;
  onChange?: (value: string, rawValue?: string) => void;
  onCepFound?: (data: CepData) => void;
  autoFetch?: boolean;
  containerClassName?: string;
}

// Format CEP: 00000-000
const formatCep = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 8);

  if (numbers.length <= 5) return numbers;
  return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
};

export const CepInput = forwardRef<HTMLInputElement, CepInputProps>(
  (
    {
      label,
      error,
      helperText,
      value = '',
      onChange,
      onCepFound,
      autoFetch = false,
      containerClassName,
      className,
      id,
      required,
      disabled,
      placeholder = '00000-000',
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;
    const [displayValue, setDisplayValue] = useState(formatCep(value));
    const [isLoading, setIsLoading] = useState(false);

    const fetchCepData = async (cep: string) => {
      if (cep.length !== 8 || !onCepFound) return;

      setIsLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          onCepFound(data as CepData);
        }
      } catch (error) {
        console.error('Error fetching CEP:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = formatCep(inputValue);
      const raw = inputValue.replace(/\D/g, '');

      setDisplayValue(formatted);
      onChange?.(raw, formatted);

      // Auto-fetch CEP data
      if (autoFetch && raw.length === 8) {
        fetchCepData(raw);
      }
    }, [onChange, autoFetch]);

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
            inputMode="numeric"
            id={inputId}
            required={required}
            disabled={disabled || isLoading}
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            maxLength={9}
            className={cn(
              'w-full px-4 py-2 rounded-lg bg-dark-800 border text-white placeholder-dark-400',
              'transition-all duration-fast',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error ? 'border-red-500 focus:ring-red-500' : 'border-dark-600',
              (disabled || isLoading) && 'opacity-60 cursor-not-allowed',
              className
            )}
            {...props}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full"
              />
            </div>
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

CepInput.displayName = 'CepInput';
