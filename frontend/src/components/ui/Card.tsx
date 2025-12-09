'use client';

import { forwardRef, ReactNode, HTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { springs } from '@/lib/animations';

// ============================================
// CARD COMPONENT
// ============================================
type CardVariant = 'default' | 'elevated' | 'outline' | 'ghost';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: CardVariant;
  hoverable?: boolean;
  clickable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-dark-900 border border-dark-800',
  elevated: 'bg-dark-900 shadow-elevated',
  outline: 'bg-transparent border-2 border-dark-700',
  ghost: 'bg-dark-900/50',
};

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      hoverable = false,
      clickable = false,
      padding = 'md',
      className,
      ...props
    },
    ref
  ) => {
    const isInteractive = hoverable || clickable;

    return (
      <motion.div
        ref={ref}
        initial={isInteractive ? { y: 0 } : undefined}
        whileHover={
          isInteractive
            ? {
                y: -4,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              }
            : undefined
        }
        transition={springs.default}
        className={cn(
          'rounded-xl',
          variantClasses[variant],
          paddingClasses[padding],
          isInteractive && 'transition-colors duration-normal cursor-pointer hover:border-dark-700',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// ============================================
// CARD HEADER
// ============================================
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ children, action, className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn('flex items-center justify-between mb-4', className)}
      {...props}
    >
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ============================================
// CARD TITLE
// ============================================
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function CardTitle({
  children,
  as: Component = 'h3',
  className,
  ...props
}: CardTitleProps) {
  return (
    <Component
      className={cn('text-lg font-semibold text-white', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

// ============================================
// CARD DESCRIPTION
// ============================================
interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function CardDescription({ children, className, ...props }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-dark-400 mt-1', className)} {...props}>
      {children}
    </p>
  );
}

// ============================================
// CARD CONTENT
// ============================================
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

// ============================================
// CARD FOOTER
// ============================================
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div
      className={cn('flex items-center gap-3 mt-4 pt-4 border-t border-dark-800', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================
// STAT CARD
// ============================================
interface StatCardProps extends Omit<CardProps, 'children'> {
  title: string;
  value: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  iconColor?: string;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = 'text-primary-500',
  trend,
  hoverable = true,
  className,
  ...props
}: StatCardProps) {
  return (
    <Card
      hoverable={hoverable}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-dark-400 text-sm font-medium">{title}</p>
          <div className="text-3xl font-bold mt-2 text-white">{value}</div>
          {subtitle && (
            <p className="text-dark-500 text-sm mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive !== false ? 'text-green-400' : 'text-red-400'
                )}
              >
                {trend.isPositive !== false ? '+' : ''}
                {trend.value}%
              </span>
              {trend.label && (
                <span className="text-dark-500 text-sm">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('flex-shrink-0', iconColor)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
