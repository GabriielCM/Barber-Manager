'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  Button,
  Select,
  Card,
  CardTitle,
  StatCard,
  StatCardSkeleton,
  Badge,
  AnimatedNumber,
} from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { notificationsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const statusConfig: Record<string, { variant: 'success' | 'info' | 'warning' | 'danger' | 'neutral'; label: string }> = {
  SENT: { variant: 'success', label: 'Enviado' },
  DELIVERED: { variant: 'info', label: 'Entregue' },
  READ: { variant: 'info', label: 'Lido' },
  FAILED: { variant: 'danger', label: 'Falhou' },
  PENDING: { variant: 'warning', label: 'Pendente' },
  SCHEDULED: { variant: 'warning', label: 'Agendado' },
};

const typeLabels = {
  APPOINTMENT_CREATED: 'Agendamento Criado',
  APPOINTMENT_CONFIRMED: 'Agendamento Confirmado',
  APPOINTMENT_CANCELLED: 'Agendamento Cancelado',
  APPOINTMENT_UPDATED: 'Agendamento Atualizado',
  APPOINTMENT_REMINDER_MORNING: 'Lembrete Manhã',
  APPOINTMENT_REMINDER_1H: 'Lembrete 1h',
  APPOINTMENT_REMINDER_15M: 'Lembrete 15min',
  MANUAL_MESSAGE: 'Mensagem Manual',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [statusFilter, typeFilter]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsApi.getAll({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        take: 50,
      });
      setNotifications(response.data.notifications);
    } catch (error) {
      toast.error('Erro ao carregar notificações');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await notificationsApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await notificationsApi.retry(id);
      toast.success('Notificação reenviada');
      fetchNotifications();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao reenviar notificação');
    }
  };

  const handleSendManual = () => {
    router.push('/dashboard/notifications/send');
  };

  const statusFilterOptions = [
    { value: '', label: 'Todos' },
    { value: 'SENT', label: 'Enviado' },
    { value: 'DELIVERED', label: 'Entregue' },
    { value: 'READ', label: 'Lido' },
    { value: 'FAILED', label: 'Falhou' },
    { value: 'PENDING', label: 'Pendente' },
    { value: 'SCHEDULED', label: 'Agendado' },
  ];

  const typeFilterOptions = [
    { value: '', label: 'Todos' },
    { value: 'APPOINTMENT_CREATED', label: 'Agendamento Criado' },
    { value: 'APPOINTMENT_REMINDER_MORNING', label: 'Lembrete Manhã' },
    { value: 'APPOINTMENT_REMINDER_1H', label: 'Lembrete 1h' },
    { value: 'APPOINTMENT_REMINDER_15M', label: 'Lembrete 15min' },
    { value: 'APPOINTMENT_CANCELLED', label: 'Cancelado' },
    { value: 'APPOINTMENT_UPDATED', label: 'Atualizado' },
    { value: 'MANUAL_MESSAGE', label: 'Mensagem Manual' },
  ];

  if (isLoading) {
    return (
      <PageTransition>
        <Header title="Notificações" subtitle="Histórico de mensagens WhatsApp" />
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Header
        title="Notificações"
        subtitle="Histórico de mensagens WhatsApp"
        action={
          <Button
            onClick={handleSendManual}
            leftIcon={<PaperAirplaneIcon className="w-5 h-5" />}
          >
            Enviar Mensagem
          </Button>
        }
      />

      <div className="p-8 space-y-6">
        {/* Statistics Cards */}
        {stats && (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StaggerItem>
              <StatCard
                title="Enviadas Hoje"
                value={<AnimatedNumber value={stats.todaySent} />}
                icon={<CheckCircleIcon className="w-6 h-6" />}
                iconColor="text-green-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Taxa de Sucesso"
                value={
                  <span className="text-blue-500">
                    <AnimatedNumber value={stats.successRate} />%
                  </span>
                }
                icon={<CheckCircleIcon className="w-6 h-6" />}
                iconColor="text-blue-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Pendentes"
                value={<AnimatedNumber value={stats.pending} />}
                icon={<ClockIcon className="w-6 h-6" />}
                iconColor="text-yellow-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Falharam"
                value={<AnimatedNumber value={stats.failed} className="text-red-500" />}
                icon={<XCircleIcon className="w-6 h-6" />}
                iconColor="text-red-500"
              />
            </StaggerItem>
          </StaggerContainer>
        )}

        {/* Filters */}
        <FadeIn delay={0.1}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors"
              >
                <FunnelIcon className="w-5 h-5" />
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                <motion.div
                  animate={{ rotate: showFilters ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </motion.div>
              </motion.button>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchNotifications}
                leftIcon={<ArrowPathIcon className="w-4 h-4" />}
              >
                Atualizar
              </Button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dark-700">
                    <Select
                      label="Status"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      options={statusFilterOptions}
                    />
                    <Select
                      label="Tipo"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      options={typeFilterOptions}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </FadeIn>

        {/* Notifications Table */}
        <FadeIn delay={0.2}>
          <Card>
            <CardTitle className="mb-4">Histórico de Notificações</CardTitle>

            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-dark-400">Nenhuma notificação encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="text-left py-3 px-4 text-dark-400 font-medium">Cliente</th>
                      <th className="text-left py-3 px-4 text-dark-400 font-medium">Tipo</th>
                      <th className="text-left py-3 px-4 text-dark-400 font-medium">Mensagem</th>
                      <th className="text-left py-3 px-4 text-dark-400 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-dark-400 font-medium">Data</th>
                      <th className="text-left py-3 px-4 text-dark-400 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((notification, index) => (
                      <motion.tr
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <p className="text-white font-medium">{notification.client?.name}</p>
                          <p className="text-dark-400 text-sm">{notification.phoneNumber.replace('@c.us', '')}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-dark-300">
                            {typeLabels[notification.type as keyof typeof typeLabels] || notification.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-white text-sm truncate max-w-xs">
                            {notification.message}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={statusConfig[notification.status]?.variant || 'neutral'}
                            size="sm"
                          >
                            {statusConfig[notification.status]?.label || notification.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-white text-sm">
                            {notification.sentAt
                              ? format(new Date(notification.sentAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                              : notification.scheduledFor
                              ? `Agendado: ${format(new Date(notification.scheduledFor), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`
                              : format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedNotification(notification)}
                            >
                              Ver
                            </Button>
                            {notification.status === 'FAILED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRetry(notification.id)}
                                leftIcon={<ArrowPathIcon className="w-4 h-4" />}
                                className="text-yellow-500 hover:text-yellow-400"
                              >
                                Reenviar
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </FadeIn>
      </div>

      {/* Notification Details Modal */}
      <Modal
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        title="Detalhes da Notificação"
        size="lg"
      >
        {selectedNotification && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-dark-400 text-sm mb-1">Cliente</p>
                <p className="text-white font-medium">{selectedNotification.client?.name}</p>
              </div>
              <div>
                <p className="text-dark-400 text-sm mb-1">Telefone</p>
                <p className="text-white">{selectedNotification.phoneNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-dark-400 text-sm mb-1">Tipo</p>
                <p className="text-white">
                  {typeLabels[selectedNotification.type as keyof typeof typeLabels]}
                </p>
              </div>
              <div>
                <p className="text-dark-400 text-sm mb-1">Status</p>
                <Badge
                  variant={statusConfig[selectedNotification.status]?.variant || 'neutral'}
                >
                  {statusConfig[selectedNotification.status]?.label || selectedNotification.status}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-dark-400 text-sm mb-1">Mensagem</p>
              <div className="bg-dark-800 p-4 rounded-lg border border-dark-700">
                <p className="text-white whitespace-pre-wrap">{selectedNotification.message}</p>
              </div>
            </div>
            {selectedNotification.errorMessage && (
              <div>
                <p className="text-dark-400 text-sm mb-1">Erro</p>
                <p className="text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  {selectedNotification.errorMessage}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dark-700">
              <div>
                <p className="text-dark-400 text-sm mb-1">Tentativas</p>
                <p className="text-white">
                  {selectedNotification.attempts} / {selectedNotification.maxAttempts}
                </p>
              </div>
              <div>
                <p className="text-dark-400 text-sm mb-1">Criado em</p>
                <p className="text-white">
                  {format(new Date(selectedNotification.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>
            {selectedNotification.status === 'FAILED' && (
              <div className="pt-4 border-t border-dark-700">
                <Button
                  onClick={() => {
                    handleRetry(selectedNotification.id);
                    setSelectedNotification(null);
                  }}
                  leftIcon={<ArrowPathIcon className="w-4 h-4" />}
                  className="w-full"
                >
                  Reenviar Notificação
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
