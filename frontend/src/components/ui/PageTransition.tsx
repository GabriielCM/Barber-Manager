'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ReactNode } from 'react';
import { pageTransitionVariants, durations, easings } from '@/lib/animations';
import { cn } from '@/lib/utils';

// ============================================
// PAGE TRANSITION
// ============================================
interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransitionVariants}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// ANIMATE PRESENCE WRAPPER
// ============================================
interface AnimatePresenceWrapperProps {
  children: ReactNode;
  mode?: 'sync' | 'wait' | 'popLayout';
}

export function AnimatePresenceWrapper({
  children,
  mode = 'wait',
}: AnimatePresenceWrapperProps) {
  return <AnimatePresence mode={mode}>{children}</AnimatePresence>;
}

// ============================================
// SLIDE TRANSITION
// ============================================
type SlideDirection = 'left' | 'right' | 'up' | 'down';

interface SlideTransitionProps {
  children: ReactNode;
  direction?: SlideDirection;
  className?: string;
}

const slideVariants: Record<SlideDirection, Variants> = {
  left: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  },
  right: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
  },
  up: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
  },
  down: {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
  },
};

export function SlideTransition({
  children,
  direction = 'up',
  className,
}: SlideTransitionProps) {
  const variants = slideVariants[direction];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{
        duration: durations.normal,
        ease: easings.easeOut,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// SCALE TRANSITION
// ============================================
interface ScaleTransitionProps {
  children: ReactNode;
  className?: string;
}

const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export function ScaleTransition({ children, className }: ScaleTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={scaleVariants}
      transition={{
        duration: durations.normal,
        ease: easings.easeOut,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// COLLAPSE TRANSITION
// ============================================
interface CollapseTransitionProps {
  children: ReactNode;
  isOpen: boolean;
  className?: string;
}

export function CollapseTransition({
  children,
  isOpen,
  className,
}: CollapseTransitionProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            duration: durations.normal,
            ease: easings.easeOut,
          }}
          className={cn('overflow-hidden', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// FADE TRANSITION
// ============================================
interface FadeTransitionProps {
  children: ReactNode;
  show: boolean;
  className?: string;
}

export function FadeTransition({ children, show, className }: FadeTransitionProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: durations.fast }}
          className={cn(className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
