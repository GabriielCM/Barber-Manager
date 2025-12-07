'use client';

import { useEffect, useState } from 'react';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { SubscriptionStatus } from '@/types/subscription';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateSubscriptionModal } from './components/CreateSubscriptionModal';
import { SubscriptionCard } from './components/SubscriptionCard';

export default function SubscriptionsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'ALL'>('ALL');
  const { subscriptions, loading, error, fetchSubscriptions } = useSubscriptions();

  useEffect(() => {
    const filters = statusFilter !== 'ALL' ? { status: statusFilter } : {};
    fetchSubscriptions(filters);
  }, [statusFilter, fetchSubscriptions]);

  const handleSubscriptionCreated = () => {
    setIsCreateModalOpen(false);
    fetchSubscriptions(statusFilter !== 'ALL' ? { status: statusFilter } : {});
  };

  const statusOptions = [
    { value: 'ALL', label: 'Todas', color: 'bg-gray-500' },
    { value: 'ACTIVE', label: 'Ativas', color: 'bg-green-500' },
    { value: 'PAUSED', label: 'Pausadas', color: 'bg-yellow-500' },
    { value: 'CANCELLED', label: 'Canceladas', color: 'bg-red-500' },
    { value: 'COMPLETED', label: 'Concluídas', color: 'bg-blue-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Assinaturas</h1>
            <p className="text-gray-400 mt-1">
              Gerencie assinaturas de agendamentos recorrentes
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Assinatura
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex gap-3 flex-wrap">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === option.value
                  ? `${option.color} text-white`
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      ) : subscriptions.length === 0 ? (
        <EmptyState
          title="Nenhuma assinatura encontrada"
          description={
            statusFilter === 'ALL'
              ? 'Crie sua primeira assinatura para começar.'
              : `Não há assinaturas com status ${statusFilter.toLowerCase()}.`
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onRefresh={() =>
                fetchSubscriptions(statusFilter !== 'ALL' ? { status: statusFilter } : {})
              }
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateSubscriptionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleSubscriptionCreated}
        />
      )}
    </div>
  );
}
