'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  Button,
  CardSkeleton,
  Alert,
} from '@/components/ui';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { SubscriptionStatus } from '@/types/subscription';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateSubscriptionModal } from './components/CreateSubscriptionModal';
import { SubscriptionCard } from './components/SubscriptionCard';
import { PlusIcon, RectangleStackIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

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
    { value: 'ALL', label: 'Todas', color: 'bg-dark-600' },
    { value: 'ACTIVE', label: 'Ativas', color: 'bg-green-500' },
    { value: 'PAUSED', label: 'Pausadas', color: 'bg-yellow-500' },
    { value: 'CANCELLED', label: 'Canceladas', color: 'bg-red-500' },
    { value: 'COMPLETED', label: 'Concluídas', color: 'bg-blue-500' },
  ];

  return (
    <PageTransition>
      <Header
        title="Assinaturas"
        subtitle="Gerencie assinaturas de agendamentos recorrentes"
      />

      <div className="p-8">
        {/* Actions */}
        <FadeIn>
          <div className="flex justify-between items-center mb-6">
            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStatusFilter(option.value as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === option.value
                      ? `${option.color} text-white`
                      : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>

            <Button
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              Nova Assinatura
            </Button>
          </div>
        </FadeIn>

        {/* Error Message */}
        {error && (
          <FadeIn>
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          </FadeIn>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <FadeIn delay={0.1}>
            <EmptyState
              icon={<RectangleStackIcon className="w-16 h-16" />}
              title="Nenhuma assinatura encontrada"
              description={
                statusFilter === 'ALL'
                  ? 'Crie sua primeira assinatura para começar.'
                  : `Não há assinaturas com status ${statusFilter.toLowerCase()}.`
              }
              action={
                statusFilter === 'ALL' ? (
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    Criar Assinatura
                  </Button>
                ) : undefined
              }
            />
          </FadeIn>
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map((subscription) => (
              <StaggerItem key={subscription.id}>
                <SubscriptionCard
                  subscription={subscription}
                  onRefresh={() =>
                    fetchSubscriptions(statusFilter !== 'ALL' ? { status: statusFilter } : {})
                  }
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateSubscriptionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleSubscriptionCreated}
        />
      )}
    </PageTransition>
  );
}
