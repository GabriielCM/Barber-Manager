'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================
type AlertVariant = 'success' | 'warning' | 'error' | 'info';

interface AlertProps {
  children: ReactNode;
  variant?: AlertVariant;
  title?: string;
  icon?: ReactNode;
  onClose?: () => void;
  closable?: boolean;
  className?: string;
}

// ============================================
// VARIANT CONFIG
// ============================================
const variantConfig: Record<
  AlertVariant,
  {
    bg: string;
    border: string;
    text: string;
    icon: typeof CheckCircleIcon;
    iconColor: string;
  }
> = {
  success: {
    bg: 'bg-green-900/20',
    border: 'border-green-800/50',
    text: 'text-green-400',
    icon: CheckCircleIcon,
    iconColor: 'text-green-400',
  },
  warning: {
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-800/50',
    text: 'text-yellow-400',
    icon: ExclamationTriangleIcon,
    iconColor: 'text-yellow-400',
  },
  error: {
    bg: 'bg-red-900/20',
    border: 'border-red-800/50',
    text: 'text-red-400',
    icon: XCircleIcon,
    iconColor: 'text-red-400',
  },
  info: {
    bg: 'bg-blue-900/20',
    border: 'border-blue-800/50',
    text: 'text-blue-400',
    icon: InformationCircleIcon,
    iconColor: 'text-blue-400',
  },
};

// ============================================
// ALERT COMPONENT
// ============================================
export function Alert({
  children,
  variant = 'info',
  title,
  icon,
  onClose,
  closable = false,
  className,
}: AlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const showClose = closable || onClose;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex gap-3 p-4 rounded-lg border',
        config.bg,
        config.border,
        className
      )}
      role="alert"
    >
      <div className={cn('flex-shrink-0 mt-0.5', config.iconColor)}>
        {icon || <Icon className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn('font-medium text-white mb-1')}>{title}</p>
        )}
        <div className={cn('text-sm', config.text)}>{children}</div>
      </div>
      {showClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 text-dark-400 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}
    </motion.div>
  );
}

// ============================================
// ALERT WITH ACTIONS
// ============================================
interface AlertWithActionsProps extends AlertProps {
  actions?: ReactNode;
}

export function AlertWithActions({
  children,
  variant = 'info',
  title,
  icon,
  onClose,
  closable = false,
  actions,
  className,
}: AlertWithActionsProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const showClose = closable || onClose;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex gap-3 p-4 rounded-lg border',
        config.bg,
        config.border,
        className
      )}
      role="alert"
    >
      <div className={cn('flex-shrink-0 mt-0.5', config.iconColor)}>
        {icon || <Icon className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn('font-medium text-white mb-1')}>{title}</p>
        )}
        <div className={cn('text-sm', config.text)}>{children}</div>
        {actions && <div className="mt-3 flex gap-2">{actions}</div>}
      </div>
      {showClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 text-dark-400 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}
    </motion.div>
  );
}

// ============================================
// INLINE ALERT (smaller, for form errors, etc.)
// ============================================
interface InlineAlertProps {
  children: ReactNode;
  variant?: AlertVariant;
  className?: string;
}

export function InlineAlert({
  children,
  variant = 'error',
  className,
}: InlineAlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn('flex items-center gap-2 text-sm', config.text, className)}
      role="alert"
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{children}</span>
    </motion.div>
  );
}

// ============================================
// DISMISSIBLE ALERT WRAPPER
// ============================================
interface DismissibleAlertProps extends AlertProps {
  show: boolean;
}

export function DismissibleAlert({
  show,
  onClose,
  ...props
}: DismissibleAlertProps) {
  return (
    <AnimatePresence>
      {show && <Alert {...props} onClose={onClose} closable />}
    </AnimatePresence>
  );
}
