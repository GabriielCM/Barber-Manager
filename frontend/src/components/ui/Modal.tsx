'use client';

import { ReactNode } from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { overlayVariants, modalVariants, springs } from '@/lib/animations';

// ============================================
// TYPES
// ============================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

// ============================================
// SIZE CLASSES
// ============================================
const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
};

// ============================================
// MODAL COMPONENT
// ============================================
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          as="div"
          className="relative z-50"
          onClose={closeOnOverlayClick ? onClose : () => {}}
          open={isOpen}
          static
        >
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />

          {/* Modal container */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Dialog.Panel
                  className={cn(
                    'w-full transform overflow-hidden rounded-xl',
                    'bg-dark-900 border border-dark-800',
                    'text-left shadow-elevated-lg',
                    sizeClasses[size],
                    className
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
                    <Dialog.Title className="text-lg font-semibold text-white">
                      {title}
                    </Dialog.Title>
                    {showCloseButton && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={springs.default}
                        onClick={onClose}
                        className="text-dark-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-dark-800"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </motion.button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                    {children}
                  </div>
                </Dialog.Panel>
              </motion.div>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

// ============================================
// MODAL WITH FOOTER
// ============================================
interface ModalWithFooterProps extends ModalProps {
  footer: ReactNode;
}

export function ModalWithFooter({
  children,
  footer,
  ...props
}: ModalWithFooterProps) {
  return (
    <AnimatePresence>
      {props.isOpen && (
        <Dialog
          as="div"
          className="relative z-50"
          onClose={props.closeOnOverlayClick !== false ? props.onClose : () => {}}
          open={props.isOpen}
          static
        >
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Dialog.Panel
                  className={cn(
                    'w-full transform overflow-hidden rounded-xl',
                    'bg-dark-900 border border-dark-800',
                    'text-left shadow-elevated-lg',
                    sizeClasses[props.size || 'md'],
                    props.className
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
                    <Dialog.Title className="text-lg font-semibold text-white">
                      {props.title}
                    </Dialog.Title>
                    {props.showCloseButton !== false && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={springs.default}
                        onClick={props.onClose}
                        className="text-dark-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-dark-800"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </motion.button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 max-h-[calc(90vh-180px)] overflow-y-auto">
                    {children}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-800 bg-dark-900/50">
                    {footer}
                  </div>
                </Dialog.Panel>
              </motion.div>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

// ============================================
// DRAWER MODAL (slides from side)
// ============================================
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

const drawerSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

const drawerVariants = {
  left: {
    hidden: { x: '-100%', opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
  },
  right: {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
  },
};

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
}: DrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          as="div"
          className="relative z-50"
          onClose={onClose}
          open={isOpen}
          static
        >
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div
                className={cn(
                  'fixed inset-y-0 flex',
                  position === 'right' ? 'right-0' : 'left-0'
                )}
              >
                <motion.div
                  variants={drawerVariants[position]}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={springs.default}
                >
                  <Dialog.Panel
                    className={cn(
                      'h-full w-screen flex flex-col',
                      'bg-dark-900 border-l border-dark-800 shadow-elevated-lg',
                      drawerSizes[size]
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
                      <Dialog.Title className="text-lg font-semibold text-white">
                        {title}
                      </Dialog.Title>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        className="text-dark-400 hover:text-white transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </motion.button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto">{children}</div>
                  </Dialog.Panel>
                </motion.div>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
