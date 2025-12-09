'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  TrashIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from './Button';
import { cn } from '@/lib/utils';
import { springs, overlayVariants, modalVariants } from '@/lib/animations';

// ============================================
// TYPES
// ============================================
type ConfirmDialogVariant = 'danger' | 'warning' | 'info' | 'question';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
  icon?: ReactNode;
}

// ============================================
// VARIANT CONFIG
// ============================================
const variantConfig: Record<
  ConfirmDialogVariant,
  {
    icon: typeof ExclamationTriangleIcon;
    iconColor: string;
    iconBg: string;
    buttonVariant: 'danger' | 'primary';
  }
> = {
  danger: {
    icon: TrashIcon,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-900/30',
    buttonVariant: 'danger',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    iconColor: 'text-yellow-500',
    iconBg: 'bg-yellow-900/30',
    buttonVariant: 'primary',
  },
  info: {
    icon: InformationCircleIcon,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-900/30',
    buttonVariant: 'primary',
  },
  question: {
    icon: QuestionMarkCircleIcon,
    iconColor: 'text-primary-500',
    iconBg: 'bg-primary-900/30',
    buttonVariant: 'primary',
  },
};

// ============================================
// CONFIRM DIALOG COMPONENT
// ============================================
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  icon,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={isLoading ? undefined : onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50"
          />

          {/* Dialog */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onKeyDown={handleKeyDown}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md bg-dark-900 rounded-xl border border-dark-800 shadow-elevated-lg"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              aria-describedby="confirm-dialog-description"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                      config.iconBg
                    )}
                  >
                    {icon || <Icon className={cn('w-6 h-6', config.iconColor)} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      id="confirm-dialog-title"
                      className="text-lg font-semibold text-white"
                    >
                      {title}
                    </h3>
                    <div
                      id="confirm-dialog-description"
                      className="mt-2 text-dark-300 text-sm"
                    >
                      {message}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    {cancelText}
                  </Button>
                  <Button
                    variant={config.buttonVariant}
                    onClick={handleConfirm}
                    isLoading={isLoading}
                  >
                    {confirmText}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// DELETE CONFIRM DIALOG (pre-configured)
// ============================================
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName?: string;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Excluir item',
  itemName,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={
        itemName ? (
          <>
            Tem certeza que deseja excluir <strong>{itemName}</strong>? Esta
            ação não pode ser desfeita.
          </>
        ) : (
          'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.'
        )
      }
      confirmText="Excluir"
      cancelText="Cancelar"
      variant="danger"
      isLoading={isLoading}
    />
  );
}

// ============================================
// LOGOUT CONFIRM DIALOG (pre-configured)
// ============================================
interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
}: LogoutConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Sair do sistema"
      message="Tem certeza que deseja sair? Você precisará fazer login novamente."
      confirmText="Sair"
      cancelText="Cancelar"
      variant="question"
    />
  );
}

// ============================================
// SAVE CHANGES CONFIRM DIALOG (pre-configured)
// ============================================
interface SaveChangesConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDiscard?: () => void;
  isLoading?: boolean;
}

export function SaveChangesConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  onDiscard,
  isLoading = false,
}: SaveChangesConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={isLoading ? undefined : onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md bg-dark-900 rounded-xl border border-dark-800 shadow-elevated-lg"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-yellow-900/30">
                    <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white">
                      Alterações não salvas
                    </h3>
                    <p className="mt-2 text-dark-300 text-sm">
                      Você tem alterações não salvas. Deseja salvar antes de
                      sair?
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  {onDiscard && (
                    <Button
                      variant="ghost"
                      onClick={onDiscard}
                      disabled={isLoading}
                    >
                      Descartar
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={onConfirm}
                    isLoading={isLoading}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
