'use client';

import { useState } from 'react';
import { Subscription, SubscriptionStatus } from '@/types/subscription';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import toast from 'react-hot-toast';
import { ResumeSubscriptionModal } from './ResumeSubscriptionModal';
import { SubscriptionDetailModal } from './SubscriptionDetailModal';
import { EyeIcon } from '@heroicons/react/24/outline';

interface Props {
  subscription: Subscription;
  onRefresh: () => void;
}

export function SubscriptionCard({ subscription, onRefresh }: Props) {
  const [showActions, setShowActions] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { pauseSubscription, cancelSubscription } = useSubscriptions();

  const statusConfig = {
    ACTIVE: { label: 'Ativa', color: 'bg-green-500' },
    PAUSED: { label: 'Pausada', color: 'bg-yellow-500' },
    CANCELLED: { label: 'Cancelada', color: 'bg-red-500' },
    COMPLETED: { label: 'Concluída', color: 'bg-blue-500' },
  };

  const planTypeLabel = subscription.planType === 'WEEKLY' ? 'Semanal' : 'Quinzenal';
  const completedSlots = subscription.completedSlots || subscription._count?.appointments || 0;
  const progress = (completedSlots / subscription.totalSlots) * 100;

  const handlePause = async () => {
    if (!confirm('Deseja pausar esta assinatura?')) return;
    try {
      await pauseSubscription(subscription.id, 'Pausada pelo usuário');
      onRefresh();
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleCancel = async () => {
    const reason = prompt('Motivo do cancelamento:');
    if (!reason) return;

    if (!confirm('Tem certeza que deseja cancelar esta assinatura?')) return;

    try {
      await cancelSubscription(subscription.id, reason);
      onRefresh();
    } catch (error) {
      // Error already handled by hook
    }
  };

  return (
    <>
    <div
      className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
      onClick={() => setShowDetailModal(true)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {subscription.client?.name || 'Cliente'}
          </h3>
          <p className="text-sm text-gray-400">
            {subscription.barber?.name || 'Barbeiro'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetailModal(true);
            }}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Ver detalhes"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
          <span
            className={`${
              statusConfig[subscription.status].color
            } text-white text-xs font-medium px-3 py-1 rounded-full`}
          >
            {statusConfig[subscription.status].label}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Plano:</span>
          <span className="text-white font-medium">{planTypeLabel}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Pacote:</span>
          <span className="text-white">{subscription.package?.name || '-'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Início:</span>
          <span className="text-white">
            {format(new Date(subscription.startDate), 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Duração:</span>
          <span className="text-white">
            {subscription.durationMonths} {subscription.durationMonths === 1 ? 'mês' : 'meses'}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Progresso</span>
          <span className="text-white font-medium">
            {completedSlots} / {subscription.totalSlots}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        {subscription.status === 'ACTIVE' && (
          <>
            <button
              onClick={handlePause}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm py-2 rounded-lg transition-colors"
            >
              Pausar
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </>
        )}
        {subscription.status === 'PAUSED' && (
          <button
            onClick={() => setShowResumeModal(true)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded-lg transition-colors"
          >
            Retomar
          </button>
        )}
      </div>

      {/* Notes */}
      {subscription.notes && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            <span className="font-medium">Obs:</span> {subscription.notes}
          </p>
        </div>
      )}
    </div>

    {/* Modals */}
    <ResumeSubscriptionModal
      isOpen={showResumeModal}
      onClose={() => setShowResumeModal(false)}
      onSuccess={onRefresh}
      subscription={subscription}
    />

    <SubscriptionDetailModal
      isOpen={showDetailModal}
      onClose={() => setShowDetailModal(false)}
      subscriptionId={subscription.id}
      onPause={subscription.status === 'ACTIVE' ? handlePause : undefined}
      onResume={subscription.status === 'PAUSED' ? () => setShowResumeModal(true) : undefined}
      onCancel={['ACTIVE', 'PAUSED'].includes(subscription.status) ? handleCancel : undefined}
    />
    </>
  );
}
