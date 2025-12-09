'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, MagnifyingGlassIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { springs } from '@/lib/animations';

// ============================================
// TYPES
// ============================================
interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  showSearch?: boolean;
  showNotifications?: boolean;
  notificationCount?: number;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  backButton?: boolean;
}

// ============================================
// HEADER COMPONENT
// ============================================
export function Header({
  title,
  subtitle,
  action,
  showSearch = true,
  showNotifications = true,
  notificationCount = 0,
  onSearch,
  searchPlaceholder = 'Buscar...',
  backButton = false,
}: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch?.('');
  };

  return (
    <header className="bg-dark-900 border-b border-dark-800 px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Title Section */}
        <div className="flex items-center gap-4">
          {backButton && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </motion.button>
          )}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-dark-400 text-sm mt-1"
            >
              {subtitle}
            </motion.p>
          )}
          </motion.div>
        </div>

        {/* Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center gap-4"
        >
          {/* Custom Action */}
          {action}

          {/* Search */}
          {showSearch && (
            <motion.div
              className="relative"
              animate={{
                width: isSearchFocused ? 320 : 256,
              }}
              transition={springs.default}
            >
              <MagnifyingGlassIcon className="w-5 h-5 text-dark-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder={searchPlaceholder}
                className={cn(
                  'w-full pl-10 pr-10 py-2 bg-dark-800 border rounded-lg',
                  'text-white placeholder-dark-400',
                  'transition-all duration-fast',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  isSearchFocused ? 'border-primary-500' : 'border-dark-700'
                )}
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Notifications */}
          {showNotifications && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={springs.default}
              className="relative p-2 text-dark-400 hover:text-white transition-colors rounded-lg hover:bg-dark-800"
            >
              <BellIcon className="w-6 h-6" />
              {notificationCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-primary-500 text-dark-950 text-xs font-bold rounded-full"
                >
                  {notificationCount > 99 ? '99+' : notificationCount}
                </motion.span>
              )}
              {notificationCount === 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"
                />
              )}
            </motion.button>
          )}
        </motion.div>
      </div>
    </header>
  );
}

// ============================================
// PAGE HEADER (simpler version)
// ============================================
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  backLink?: string;
}

export function PageHeader({
  title,
  description,
  action,
  backLink,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {description && (
          <p className="text-dark-400 text-sm mt-1">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </motion.div>
  );
}

// ============================================
// SECTION HEADER
// ============================================
interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description && (
          <p className="text-dark-400 text-sm mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
