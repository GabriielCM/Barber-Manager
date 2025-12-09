'use client';

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { staggerContainerVariants, staggerItemVariants } from '@/lib/animations';
import { TableSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

// ============================================
// TYPES
// ============================================
interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T, index: number) => ReactNode;
  className?: string;
}

type SortDirection = 'asc' | 'desc';

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T, index: number) => string;
  onSort?: (key: string, direction: SortDirection) => void;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  className?: string;
  stickyHeader?: boolean;
  striped?: boolean;
  animated?: boolean;
}

// ============================================
// TABLE COMPONENT
// ============================================
export function Table<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onSort,
  onRowClick,
  isLoading = false,
  emptyIcon,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription,
  emptyAction,
  className,
  stickyHeader = false,
  striped = false,
  animated = true,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (key: string) => {
    const newDirection: SortDirection =
      sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(newDirection);
    onSort?.(key, newDirection);
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  // Loading state
  if (isLoading) {
    return <TableSkeleton rows={5} columns={columns.length} className={className} />;
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn('card p-8', className)}>
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div className={cn('table-container', className)}>
      <table className="table">
        <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={column.sortable ? () => handleSort(column.key) : undefined}
                className={cn(
                  alignClasses[column.align || 'left'],
                  column.sortable && 'table-sortable',
                  column.className
                )}
                style={{ width: column.width }}
              >
                <div className="flex items-center gap-2">
                  <span>{column.header}</span>
                  {column.sortable && (
                    <span className="flex flex-col">
                      <ChevronUpIcon
                        className={cn(
                          'w-3 h-3 -mb-1',
                          sortKey === column.key && sortDirection === 'asc'
                            ? 'text-primary-500'
                            : 'text-dark-600'
                        )}
                      />
                      <ChevronDownIcon
                        className={cn(
                          'w-3 h-3',
                          sortKey === column.key && sortDirection === 'desc'
                            ? 'text-primary-500'
                            : 'text-dark-600'
                        )}
                      />
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <motion.tbody
          variants={animated ? staggerContainerVariants : undefined}
          initial={animated ? 'hidden' : undefined}
          animate={animated ? 'visible' : undefined}
        >
          {data.map((row, index) => (
            <motion.tr
              key={keyExtractor(row, index)}
              variants={animated ? staggerItemVariants : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                onRowClick && 'cursor-pointer',
                striped && index % 2 === 1 && 'bg-dark-800/30'
              )}
              layout
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    alignClasses[column.align || 'left'],
                    column.className
                  )}
                >
                  {column.render
                    ? column.render(row, index)
                    : row[column.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}

// ============================================
// SIMPLE TABLE (without sorting/animations)
// ============================================
interface SimpleTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T, index: number) => string;
  className?: string;
}

export function SimpleTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  className,
}: SimpleTableProps<T>) {
  return (
    <div className={cn('table-container', className)}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={keyExtractor(row, index)}>
              {columns.map((column) => (
                <td key={column.key} className={column.className}>
                  {column.render ? column.render(row, index) : row[column.key]}
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
// TABLE ACTIONS (for action column)
// ============================================
interface TableActionsProps {
  children: ReactNode;
  className?: string;
}

export function TableActions({ children, className }: TableActionsProps) {
  return (
    <div className={cn('flex items-center justify-end gap-1', className)}>
      {children}
    </div>
  );
}

// ============================================
// TABLE CELL COMPONENTS
// ============================================
interface TableCellTextProps {
  primary: ReactNode;
  secondary?: ReactNode;
}

export function TableCellText({ primary, secondary }: TableCellTextProps) {
  return (
    <div>
      <div className="font-medium text-white">{primary}</div>
      {secondary && <div className="text-sm text-dark-400">{secondary}</div>}
    </div>
  );
}

interface TableCellWithAvatarProps {
  avatar: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
}

export function TableCellWithAvatar({
  avatar,
  primary,
  secondary,
}: TableCellWithAvatarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">{avatar}</div>
      <TableCellText primary={primary} secondary={secondary} />
    </div>
  );
}
