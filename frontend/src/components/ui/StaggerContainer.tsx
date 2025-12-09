'use client';

import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { ReactNode } from 'react';
import { durations, easings, staggerItemVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

// ============================================
// STAGGER CONTAINER
// ============================================
interface StaggerContainerProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  staggerDelay?: number;
  delayChildren?: number;
  className?: string;
  once?: boolean;
}

export function StaggerContainer({
  children,
  staggerDelay = 0.05,
  delayChildren = 0.1,
  className,
  once = true,
  ...props
}: StaggerContainerProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      variants={containerVariants}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// STAGGER ITEM
// ============================================
interface StaggerItemProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className, ...props }: StaggerItemProps) {
  return (
    <motion.div
      variants={staggerItemVariants}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// STAGGER LIST (for ul/ol elements)
// ============================================
interface StaggerListProps extends Omit<HTMLMotionProps<'ul'>, 'children'> {
  children: ReactNode;
  staggerDelay?: number;
  delayChildren?: number;
  className?: string;
  once?: boolean;
  ordered?: boolean;
}

export function StaggerList({
  children,
  staggerDelay = 0.05,
  delayChildren = 0.1,
  className,
  once = true,
  ordered = false,
  ...props
}: StaggerListProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  };

  const Component = ordered ? motion.ol : motion.ul;

  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      variants={containerVariants}
      className={cn(className)}
      {...(props as any)}
    >
      {children}
    </Component>
  );
}

// ============================================
// STAGGER LIST ITEM
// ============================================
interface StaggerListItemProps extends Omit<HTMLMotionProps<'li'>, 'children'> {
  children: ReactNode;
  className?: string;
}

export function StaggerListItem({ children, className, ...props }: StaggerListItemProps) {
  return (
    <motion.li
      variants={staggerItemVariants}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.li>
  );
}

// ============================================
// STAGGER GRID (for grid layouts)
// ============================================
interface StaggerGridProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  staggerDelay?: number;
  delayChildren?: number;
  className?: string;
  once?: boolean;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
}

const gridColumnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
};

export function StaggerGrid({
  children,
  staggerDelay = 0.05,
  delayChildren = 0.1,
  className,
  once = true,
  columns = 3,
  ...props
}: StaggerGridProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      variants={containerVariants}
      className={cn('grid gap-6', gridColumnClasses[columns], className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
