'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================
// ANIMATED NUMBER
// ============================================
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  formatFn?: (value: number) => string;
  className?: string;
  animateOnView?: boolean;
}

export function AnimatedNumber({
  value,
  duration = 1,
  delay = 0,
  formatFn = (v) => Math.round(v).toLocaleString('pt-BR'),
  className,
  animateOnView = true,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState('0');

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const display = useTransform(spring, (current) => formatFn(current));

  useEffect(() => {
    if (!animateOnView || isInView) {
      const timeout = setTimeout(() => {
        spring.set(value);
      }, delay * 1000);

      return () => clearTimeout(timeout);
    }
  }, [spring, value, isInView, animateOnView, delay]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => setDisplayValue(v));
    return unsubscribe;
  }, [display]);

  return (
    <span ref={ref} className={cn(className)}>
      {displayValue}
    </span>
  );
}

// ============================================
// ANIMATED CURRENCY (Brazilian Real)
// ============================================
interface AnimatedCurrencyProps {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
  animateOnView?: boolean;
  showSign?: boolean;
}

export function AnimatedCurrency({
  value,
  duration = 1,
  delay = 0,
  className,
  animateOnView = true,
  showSign = false,
}: AnimatedCurrencyProps) {
  const formatCurrency = (v: number) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(v));

    if (showSign && value !== 0) {
      return value > 0 ? `+${formatted}` : `-${formatted}`;
    }
    return formatted;
  };

  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      delay={delay}
      formatFn={formatCurrency}
      className={cn(
        showSign && value > 0 && 'text-green-400',
        showSign && value < 0 && 'text-red-400',
        className
      )}
      animateOnView={animateOnView}
    />
  );
}

// ============================================
// ANIMATED PERCENTAGE
// ============================================
interface AnimatedPercentageProps {
  value: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  className?: string;
  animateOnView?: boolean;
  showSign?: boolean;
}

export function AnimatedPercentage({
  value,
  duration = 1,
  delay = 0,
  decimals = 1,
  className,
  animateOnView = true,
  showSign = false,
}: AnimatedPercentageProps) {
  const formatPercentage = (v: number) => {
    const formatted = `${v.toFixed(decimals)}%`;
    if (showSign && value !== 0) {
      return value > 0 ? `+${formatted}` : formatted;
    }
    return formatted;
  };

  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      delay={delay}
      formatFn={formatPercentage}
      className={cn(
        showSign && value > 0 && 'text-green-400',
        showSign && value < 0 && 'text-red-400',
        className
      )}
      animateOnView={animateOnView}
    />
  );
}

// ============================================
// COUNTER (Simple counting animation)
// ============================================
interface CounterProps {
  from?: number;
  to: number;
  duration?: number;
  delay?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export function Counter({
  from = 0,
  to,
  duration = 1,
  delay = 0,
  className,
  suffix = '',
  prefix = '',
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (!isInView) return;

    const timeout = setTimeout(() => {
      let startTime: number;
      let animationFrame: number;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);

        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentCount = Math.round(from + (to - from) * easeOut);

        setCount(currentCount);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);

      return () => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
      };
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [isInView, from, to, duration, delay]);

  return (
    <span ref={ref} className={cn(className)}>
      {prefix}
      {count.toLocaleString('pt-BR')}
      {suffix}
    </span>
  );
}

// ============================================
// ANIMATED VALUE WITH TREND
// ============================================
interface AnimatedValueWithTrendProps {
  value: number;
  previousValue?: number;
  duration?: number;
  formatFn?: (value: number) => string;
  className?: string;
  trendClassName?: string;
}

export function AnimatedValueWithTrend({
  value,
  previousValue,
  duration = 1,
  formatFn = (v) => v.toLocaleString('pt-BR'),
  className,
  trendClassName,
}: AnimatedValueWithTrendProps) {
  const trend = previousValue !== undefined ? value - previousValue : 0;
  const trendPercentage =
    previousValue !== undefined && previousValue !== 0
      ? ((value - previousValue) / previousValue) * 100
      : 0;

  return (
    <div className="flex items-baseline gap-2">
      <AnimatedNumber
        value={value}
        duration={duration}
        formatFn={formatFn}
        className={className}
      />
      {previousValue !== undefined && trend !== 0 && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: duration * 0.8 }}
          className={cn(
            'text-sm font-medium',
            trend > 0 ? 'text-green-400' : 'text-red-400',
            trendClassName
          )}
        >
          {trend > 0 ? '↑' : '↓'} {Math.abs(trendPercentage).toFixed(1)}%
        </motion.span>
      )}
    </div>
  );
}
