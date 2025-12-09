'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { springs } from '@/lib/animations';

// ============================================
// TYPES
// ============================================
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
}

// ============================================
// STYLE MAPS
// ============================================
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-dark-950 hover:shadow-glow-sm focus:ring-primary-500',
  secondary: 'bg-dark-700 hover:bg-dark-600 text-white border border-dark-600 focus:ring-dark-500',
  danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
  ghost: 'bg-transparent hover:bg-dark-800 text-dark-300 hover:text-white focus:ring-dark-500',
  outline: 'bg-transparent border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-dark-950 focus:ring-primary-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
  lg: 'px-6 py-3 text-lg gap-2.5',
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

// ============================================
// LOADING SPINNER
// ============================================
function ButtonSpinner({ size }: { size: ButtonSize }) {
  return (
    <svg
      className={cn('animate-spin', iconSizeClasses[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ============================================
// BUTTON COMPONENT
// ============================================
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={isDisabled ? undefined : { scale: 1.02 }}
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
        transition={springs.default}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium rounded-lg',
          'transition-colors duration-fast',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-950',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          // Variant styles
          variantClasses[variant],
          // Size styles
          sizeClasses[size],
          // Full width
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <ButtonSpinner size={size} />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className={cn('flex-shrink-0', iconSizeClasses[size])}>
                {leftIcon}
              </span>
            )}
            <span>{children}</span>
            {rightIcon && (
              <span className={cn('flex-shrink-0', iconSizeClasses[size])}>
                {rightIcon}
              </span>
            )}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// ============================================
// ICON BUTTON COMPONENT
// ============================================
type IconButtonVariant = 'default' | 'primary' | 'danger';

interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: ButtonSize;
  label: string; // For accessibility
  disabled?: boolean;
}

const iconButtonVariantClasses: Record<IconButtonVariant, string> = {
  default: 'text-dark-400 hover:text-white hover:bg-dark-800',
  primary: 'text-dark-400 hover:text-primary-500 hover:bg-primary-500/10',
  danger: 'text-dark-400 hover:text-red-500 hover:bg-red-500/10',
};

const iconButtonSizeClasses: Record<ButtonSize, string> = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = 'default',
      size = 'md',
      label,
      disabled,
      className,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={disabled ? undefined : { scale: 1.1 }}
        whileTap={disabled ? undefined : { scale: 0.95 }}
        transition={springs.default}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={cn(
          'rounded-lg transition-colors duration-fast',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-950',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          iconButtonVariantClasses[variant],
          iconButtonSizeClasses[size],
          className
        )}
        {...props}
      >
        <span className={iconSizeClasses[size]}>{icon}</span>
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';
