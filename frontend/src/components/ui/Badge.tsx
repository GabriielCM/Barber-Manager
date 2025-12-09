'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { springs } from '@/lib/animations';

// ============================================
// TYPES
// ============================================
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  animated?: boolean;
  className?: string;
}

// ============================================
// STYLE MAPS
// ============================================
const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-900/50 text-green-400 border-green-800/50',
  warning: 'bg-yellow-900/50 text-yellow-400 border-yellow-800/50',
  danger: 'bg-red-900/50 text-red-400 border-red-800/50',
  info: 'bg-blue-900/50 text-blue-400 border-blue-800/50',
  neutral: 'bg-dark-700 text-dark-300 border-dark-600',
  primary: 'bg-primary-900/50 text-primary-400 border-primary-800/50',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  danger: 'bg-red-400',
  info: 'bg-blue-400',
  neutral: 'bg-dark-400',
  primary: 'bg-primary-400',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

// ============================================
// BADGE COMPONENT
// ============================================
export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  removable = false,
  onRemove,
  animated = true,
  className,
}: BadgeProps) {
  const Component = animated ? motion.span : 'span';
  const animationProps = animated
    ? {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.9, opacity: 0 },
        transition: springs.bounce,
      }
    : {};

  return (
    <Component
      {...animationProps}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])}
        />
      )}
      <span>{children}</span>
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 -mr-1 hover:opacity-70 transition-opacity"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </Component>
  );
}

// ============================================
// STATUS BADGE (Pre-configured for common statuses)
// ============================================
type StatusType = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'error';

interface StatusBadgeProps {
  status: StatusType;
  showDot?: boolean;
  size?: BadgeSize;
  className?: string;
}

const statusConfig: Record<StatusType, { variant: BadgeVariant; label: string }> = {
  active: { variant: 'success', label: 'Ativo' },
  inactive: { variant: 'neutral', label: 'Inativo' },
  pending: { variant: 'warning', label: 'Pendente' },
  completed: { variant: 'success', label: 'Concluído' },
  cancelled: { variant: 'danger', label: 'Cancelado' },
  error: { variant: 'danger', label: 'Erro' },
};

export function StatusBadge({
  status,
  showDot = true,
  size = 'sm',
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} dot={showDot} size={size} className={className}>
      {config.label}
    </Badge>
  );
}

// ============================================
// COUNT BADGE (for notifications, etc.)
// ============================================
interface CountBadgeProps {
  count: number;
  max?: number;
  variant?: BadgeVariant;
  className?: string;
}

export function CountBadge({
  count,
  max = 99,
  variant = 'danger',
  className,
}: CountBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold',
        variant === 'danger' && 'bg-red-500 text-white',
        variant === 'primary' && 'bg-primary-500 text-dark-950',
        variant === 'success' && 'bg-green-500 text-white',
        className
      )}
    >
      {displayCount}
    </motion.span>
  );
}

// ============================================
// DOT INDICATOR
// ============================================
interface DotIndicatorProps {
  variant?: BadgeVariant;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const dotSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export function DotIndicator({
  variant = 'success',
  pulse = false,
  size = 'md',
  className,
}: DotIndicatorProps) {
  return (
    <span className={cn('relative inline-flex', className)}>
      <span
        className={cn(
          'rounded-full',
          dotColors[variant],
          dotSizes[size],
          pulse && 'animate-pulse-soft'
        )}
      />
      {pulse && (
        <span
          className={cn(
            'absolute inline-flex rounded-full opacity-75 animate-ping',
            dotColors[variant],
            dotSizes[size]
          )}
        />
      )}
    </span>
  );
}
