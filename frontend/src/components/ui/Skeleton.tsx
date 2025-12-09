'use client';

import { cn } from '@/lib/utils';

// ============================================
// BASE SKELETON
// ============================================
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={cn(
        'skeleton animate-pulse bg-dark-800',
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
    />
  );
}

// ============================================
// TEXT SKELETON (multiple lines)
// ============================================
interface TextSkeletonProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

export function TextSkeleton({
  lines = 3,
  className,
  lastLineWidth = '75%',
}: TextSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

// ============================================
// TABLE SKELETON
// ============================================
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn('table-container', className)}>
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <Skeleton width="80%" height={16} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx}>
                  <Skeleton width="90%" height={16} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// CARD SKELETON
// ============================================
interface CardSkeletonProps {
  hasImage?: boolean;
  hasFooter?: boolean;
  className?: string;
}

export function CardSkeleton({
  hasImage = false,
  hasFooter = false,
  className,
}: CardSkeletonProps) {
  return (
    <div className={cn('card', className)}>
      {hasImage && (
        <Skeleton
          width="100%"
          height={160}
          className="mb-4 -mx-6 -mt-6 rounded-t-xl rounded-b-none"
        />
      )}
      <Skeleton width="60%" height={24} className="mb-4" />
      <TextSkeleton lines={3} className="mb-4" />
      {hasFooter && (
        <div className="flex gap-2 pt-4 border-t border-dark-800">
          <Skeleton width={80} height={36} />
          <Skeleton width={80} height={36} />
        </div>
      )}
    </div>
  );
}

// ============================================
// STAT CARD SKELETON
// ============================================
interface StatCardSkeletonProps {
  className?: string;
}

export function StatCardSkeleton({ className }: StatCardSkeletonProps) {
  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-center justify-between mb-2">
        <Skeleton width="40%" height={14} />
        <Skeleton variant="circular" width={24} height={24} />
      </div>
      <Skeleton width="60%" height={36} className="mb-1" />
      <Skeleton width="50%" height={14} />
    </div>
  );
}

// ============================================
// LIST SKELETON
// ============================================
interface ListSkeletonProps {
  items?: number;
  hasAvatar?: boolean;
  hasAction?: boolean;
  className?: string;
}

export function ListSkeleton({
  items = 5,
  hasAvatar = false,
  hasAction = false,
  className,
}: ListSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {hasAvatar && <Skeleton variant="circular" width={40} height={40} />}
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height={16} />
            <Skeleton width="70%" height={14} />
          </div>
          {hasAction && <Skeleton width={60} height={32} />}
        </div>
      ))}
    </div>
  );
}

// ============================================
// FORM SKELETON
// ============================================
interface FormSkeletonProps {
  fields?: number;
  hasSubmit?: boolean;
  className?: string;
}

export function FormSkeleton({
  fields = 4,
  hasSubmit = true,
  className,
}: FormSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1">
          <Skeleton width="30%" height={14} />
          <Skeleton width="100%" height={40} />
        </div>
      ))}
      {hasSubmit && (
        <div className="flex justify-end gap-2 pt-4">
          <Skeleton width={100} height={40} />
          <Skeleton width={100} height={40} />
        </div>
      )}
    </div>
  );
}

// ============================================
// AVATAR SKELETON
// ============================================
interface AvatarSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const avatarSizes = {
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 48, height: 48 },
};

export function AvatarSkeleton({ size = 'md', className }: AvatarSkeletonProps) {
  const { width, height } = avatarSizes[size];
  return (
    <Skeleton
      variant="circular"
      width={width}
      height={height}
      className={className}
    />
  );
}

// ============================================
// GRID SKELETON
// ============================================
interface GridSkeletonProps {
  items?: number;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

const gridColumnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

export function GridSkeleton({
  items = 6,
  columns = 3,
  className,
}: GridSkeletonProps) {
  return (
    <div className={cn('grid gap-6', gridColumnClasses[columns], className)}>
      {Array.from({ length: items }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
