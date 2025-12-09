'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, TargetAndTransition } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: TooltipPosition;
  delay?: number;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
}

// ============================================
// POSITION STYLES
// ============================================
const positionClasses: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowClasses: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-dark-700 border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-dark-700 border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-dark-700 border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-dark-700 border-y-transparent border-l-transparent',
};

const animationVariants: Record<TooltipPosition, { initial: TargetAndTransition; animate: TargetAndTransition }> = {
  top: {
    initial: { opacity: 0, y: 5, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
  },
  bottom: {
    initial: { opacity: 0, y: -5, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
  },
  left: {
    initial: { opacity: 0, x: 5, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1 },
  },
  right: {
    initial: { opacity: 0, x: -5, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1 },
  },
};

// ============================================
// TOOLTIP COMPONENT
// ============================================
export function Tooltip({
  children,
  content,
  position = 'top',
  delay = 300,
  disabled = false,
  className,
  contentClassName,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const variants = animationVariants[position];

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={variants.initial}
            animate={variants.animate}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 px-3 py-1.5 text-sm text-white bg-dark-700 rounded-lg',
              'shadow-lg whitespace-nowrap pointer-events-none',
              positionClasses[position],
              contentClassName
            )}
          >
            {content}
            <span
              className={cn('absolute w-0 h-0 border-4', arrowClasses[position])}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// SIMPLE TOOLTIP (text only, simpler API)
// ============================================
interface SimpleTooltipProps {
  children: ReactNode;
  text: string;
  position?: TooltipPosition;
  delay?: number;
}

export function SimpleTooltip({
  children,
  text,
  position = 'top',
  delay = 300,
}: SimpleTooltipProps) {
  return (
    <Tooltip content={text} position={position} delay={delay}>
      {children}
    </Tooltip>
  );
}

// ============================================
// TOOLTIP TRIGGER (for more control)
// ============================================
interface TooltipTriggerProps {
  children: ReactNode;
  tooltip: ReactNode;
  position?: TooltipPosition;
  delay?: number;
  disabled?: boolean;
}

export function TooltipTrigger({
  children,
  tooltip,
  position = 'top',
  delay = 300,
  disabled = false,
}: TooltipTriggerProps) {
  return (
    <Tooltip
      content={tooltip}
      position={position}
      delay={delay}
      disabled={disabled}
    >
      <span className="cursor-help">{children}</span>
    </Tooltip>
  );
}
