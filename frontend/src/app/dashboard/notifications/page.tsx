'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { notificationsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors = {
  SENT: 'text-green-500 bg-green-500/10',
  DELIVERED: 'text-blue-500 bg-blue-500/10',
  READ: 'text-purple-500 bg-purple-500/10',
  FAILED: 'text-red-500 bg-red-500/10',
  PENDING: 'text-yellow-500 bg-yellow-500/10',
  SCHEDULED: 'text-orange-500 bg-orange-500/10',
};

const statusLabels = {
  SENT: 'Enviado',
  DELIVERED: 'Entregue',
  READ: 'Lido',
  FAILED: 'Falhou',
  PENDING: 'Pendente',
  SCHEDULED: 'Agendado',
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

  if (isLoading) return <PageLoading />;

  return (
    <>
      <Header
        title="Notificações"
        subtitle="Histórico de mensagens WhatsApp"
        action={
          <button onClick={handleSendManual} className="btn btn-primary flex items-center gap-2">
            <PaperAirplaneIcon className="w-5 h-5" />
            Enviar Mensagem
          </button>
        }
      />

      <div className="p-8 space-y-6">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 text-sm">Enviadas Hoje</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.todaySent}</p>
                </div>
                <CheckCircleIcon className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 text-sm">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.successRate}%</p>
                </div>
                <CheckCircleIcon className="w-10 h-10 text-blue-500" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 text-sm">Pendentes</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.pending}</p>
                </div>
                <ClockIcon className="w-10 h-10 text-yellow-500" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 text-sm">Falharam</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.failed}</p>
                </div>
                <XCircleIcon className="w-10 h-10 text-red-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-dark-400 hover:text-white"
            >
              <FunnelIcon className="w-5 h-5" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
            <button
              onClick={fetchNotifications}
              className="btn btn-secondary btn-sm flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Atualizar
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input"
                >
                  <option value="">Todos</option>
                  <option value="SENT">Enviado</option>
                  <option value="DELIVERED">Entregue</option>
                  <option value="READ">Lido</option>
                  <option value="FAILED">Falhou</option>
                  <option value="PENDING">Pendente</option>
                  <option value="SCHEDULED">Agendado</option>
                </select>
              </div>
              <div>
                <label className="label">Tipo</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="input"
                >
                  <option value="">Todos</option>
                  <option value="APPOINTMENT_CREATED">Agendamento Criado</option>
                  <option value="APPOINTMENT_REMINDER_MORNING">Lembrete Manhã</option>
                  <option value="APPOINTMENT_REMINDER_1H">Lembrete 1h</option>
                  <option value="APPOINTMENT_REMINDER_15M">Lembrete 15min</option>
                  <option value="APPOINTMENT_CANCELLED">Cancelado</option>
                  <option value="APPOINTMENT_UPDATED">Atualizado</option>
                  <option value="MANUAL_MESSAGE">Mensagem Manual</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Table */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Histórico de Notificações</h3>

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
                  {notifications.map((notification) => (
                    <tr key={notification.id} className="border-b border-dark-800 hover:bg-dark-800">
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
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            statusColors[notification.status as keyof typeof statusColors]
                          }`}
                        >
                          {statusLabels[notification.status as keyof typeof statusLabels] || notification.status}
                        </span>
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
                          <button
                            onClick={() => setSelectedNotification(notification)}
                            className="text-primary-500 hover:text-primary-400 text-sm"
                          >
                            Ver
                          </button>
                          {notification.status === 'FAILED' && (
                            <button
                              onClick={() => handleRetry(notification.id)}
                              className="text-yellow-500 hover:text-yellow-400 text-sm flex items-center gap-1"
                            >
                              <ArrowPathIcon className="w-4 h-4" />
                              Reenviar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notification Details Modal */}
        {selectedNotification && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-dark-700 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Detalhes da Notificação</h3>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-dark-400 hover:text-white"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-dark-400 text-sm mb-1">Cliente</p>
                  <p className="text-white font-medium">{selectedNotification.client?.name}</p>
                </div>
                <div>
                  <p className="text-dark-400 text-sm mb-1">Telefone</p>
                  <p className="text-white">{selectedNotification.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-dark-400 text-sm mb-1">Tipo</p>
                  <p className="text-white">
                    {typeLabels[selectedNotification.type as keyof typeof typeLabels]}
                  </p>
                </div>
                <div>
                  <p className="text-dark-400 text-sm mb-1">Status</p>
                  <span
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      statusColors[selectedNotification.status as keyof typeof statusColors]
                    }`}
                  >
                    {statusLabels[selectedNotification.status as keyof typeof statusLabels]}
                  </span>
                </div>
                <div>
                  <p className="text-dark-400 text-sm mb-1">Mensagem</p>
                  <div className="bg-dark-800 p-4 rounded-lg">
                    <p className="text-white whitespace-pre-wrap">{selectedNotification.message}</p>
                  </div>
                </div>
                {selectedNotification.errorMessage && (
                  <div>
                    <p className="text-dark-400 text-sm mb-1">Erro</p>
                    <p className="text-red-500">{selectedNotification.errorMessage}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
