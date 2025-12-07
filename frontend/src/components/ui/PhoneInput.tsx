import React, { forwardRef } from 'react';
import InputMask from 'react-input-mask';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Phone input component with Brazilian phone number mask
 * Format: (DD) 9DDDD-DDDD
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, error, placeholder = '(34) 99876-5432', className = '', disabled = false }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Remove all non-digit characters for storage
      const cleaned = e.target.value.replace(/\D/g, '');
      onChange(cleaned);
    };

    return (
      <div className="w-full">
        <InputMask
          mask="(99) 99999-9999"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`input ${error ? 'border-red-500' : ''} ${className}`}
        >
          {(inputProps: any) => <input {...inputProps} ref={ref} type="text" />}
        </InputMask>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
