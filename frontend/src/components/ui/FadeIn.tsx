'use client';

import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { ReactNode } from 'react';
import { durations, easings } from '@/lib/animations';
import { cn } from '@/lib/utils';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface FadeInProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  once?: boolean;
}

const createDirectionVariants = (direction: Direction, distance: number): Variants => {
  const axis = direction === 'up' || direction === 'down' ? 'y' : 'x';
  const value = direction === 'up' || direction === 'left' ? distance : -distance;

  if (direction === 'none') {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    };
  }

  return {
    hidden: { opacity: 0, [axis]: value },
    visible: { opacity: 1, [axis]: 0 },
  };
};

export function FadeIn({
  children,
  direction = 'up',
  delay = 0,
  duration = durations.normal,
  distance = 20,
  className,
  once = true,
  ...props
}: FadeInProps) {
  const variants = createDirectionVariants(direction, distance);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: easings.easeOut,
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Convenience components for common directions
export function FadeInUp(props: Omit<FadeInProps, 'direction'>) {
  return <FadeIn {...props} direction="up" />;
}

export function FadeInDown(props: Omit<FadeInProps, 'direction'>) {
  return <FadeIn {...props} direction="down" />;
}

export function FadeInLeft(props: Omit<FadeInProps, 'direction'>) {
  return <FadeIn {...props} direction="left" />;
}

export function FadeInRight(props: Omit<FadeInProps, 'direction'>) {
  return <FadeIn {...props} direction="right" />;
}
