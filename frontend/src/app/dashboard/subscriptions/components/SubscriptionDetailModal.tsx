'use client';

import { useState, useEffect, useMemo } from 'react';
import { Subscription, SubscriptionChangeLog } from '@/types/subscription';
import { subscriptionsApi } from '@/lib/api';
import { format, isPast, isFuture, isToday, compareAsc } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  Modal,
  Card,
  Badge,
  Button,
  FadeIn,
  Skeleton,
} from '@/components/ui';
import {
  UserIcon,
  ScissorsIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string | null;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

type AppointmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

interface SubscriptionAppointment {
  id: string;
  dateTime: string;
  status: AppointmentStatus;
  subscriptionSlotIndex: number;
  services: Array<{
    service: {
      id: string;
      name: string;
      duration: number;
    };
  }>;
}

export function SubscriptionDetailModal({
  isOpen,
  onClose,
  subscriptionId,
  onPause,
  onResume,
  onCancel,
}: Props) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [showChangeLogs, setShowChangeLogs] = useState(false);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!isOpen || !subscriptionId) return;

      setLoading(true);
      try {
        const response = await subscriptionsApi.getOne(subscriptionId);
        setSubscription(response.data);
      } catch (error) {
        toast.error('Erro ao carregar detalhes da assinatura');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [isOpen, subscriptionId, onClose]);

  const handleClose = () => {
    setSubscription(null);
    setShowAllAppointments(false);
    setShowChangeLogs(false);
    onClose();
  };

  // Separate and sort appointments
  const { upcomingAppointments, pastAppointments, completedCount } = useMemo(() => {
    if (!subscription?.appointments) {
      return { upcomingAppointments: [], pastAppointments: [], completedCount: 0 };
    }

    const now = new Date();
    const upcoming: SubscriptionAppointment[] = [];
    const past: SubscriptionAppointment[] = [];
    let completed = 0;

    subscription.appointments.forEach((apt: SubscriptionAppointment) => {
      const aptDate = new Date(apt.dateTime);
      if (apt.status === 'COMPLETED') {
        completed++;
        past.push(apt);
      } else if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW') {
        past.push(apt);
      } else if (isFuture(aptDate) || isToday(aptDate)) {
        upcoming.push(apt);
      } else {
        past.push(apt);
      }
    });

    // Sort upcoming by date ascending
    upcoming.sort((a, b) => compareAsc(new Date(a.dateTime), new Date(b.dateTime)));
    // Sort past by date descending
    past.sort((a, b) => compareAsc(new Date(b.dateTime), new Date(a.dateTime)));

    return { upcomingAppointments: upcoming, pastAppointments: past, completedCount: completed };
  }, [subscription]);

  const statusConfig = {
    ACTIVE: { label: 'Ativa', color: 'success', icon: PlayCircleIcon },
    PAUSED: { label: 'Pausada', color: 'warning', icon: PauseCircleIcon },
    CANCELLED: { label: 'Cancelada', color: 'danger', icon: XCircleIcon },
    COMPLETED: { label: 'Concluida', color: 'info', icon: CheckCircleIcon },
  } as const;

  const appointmentStatusConfig = {
    SCHEDULED: { label: 'Agendado', variant: 'info' as const },
    IN_PROGRESS: { label: 'Em Andamento', variant: 'warning' as const },
    COMPLETED: { label: 'Concluido', variant: 'success' as const },
    CANCELLED: { label: 'Cancelado', variant: 'danger' as const },
    NO_SHOW: { label: 'Nao Compareceu', variant: 'danger' as const },
  };

  const changeTypeLabels: Record<string, string> = {
    CREATED: 'Criada',
    PLAN_CHANGED: 'Plano Alterado',
    APPOINTMENT_ADJUSTED: 'Agendamento Ajustado',
    PAUSED: 'Pausada',
    RESUMED: 'Retomada',
    CANCELLED: 'Cancelada',
    PACKAGE_UPDATED: 'Pacote Atualizado',
    PACKAGE_CHANGED: 'Pacote Alterado',
  };

  if (!isOpen) return null;

  const StatusIcon = subscription ? statusConfig[subscription.status].icon : InformationCircleIcon;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Detalhes da Assinatura" size="xl">
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
          <Skeleton className="h-24" />
        </div>
      ) : subscription ? (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Header with Status */}
          <Card className="bg-gradient-to-r from-dark-800 to-dark-700 border-dark-600">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-500/20 rounded-full">
                  <StatusIcon className="w-8 h-8 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {subscription.client?.name}
                  </h3>
                  <p className="text-dark-300">
                    com {subscription.barber?.name}
                  </p>
                </div>
              </div>
              <Badge
                variant={statusConfig[subscription.status].color}
                size="lg"
              >
                {statusConfig[subscription.status].label}
              </Badge>
            </div>
          </Card>

          {/* Subscription Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card variant="outline" className="bg-dark-800/50">
              <div className="flex items-center gap-3 mb-3">
                <CalendarIcon className="w-5 h-5 text-primary-400" />
                <h4 className="font-semibold text-white">Periodo</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">Inicio:</span>
                  <span className="text-white">
                    {format(new Date(subscription.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Fim Previsto:</span>
                  <span className="text-white">
                    {format(new Date(subscription.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Duracao:</span>
                  <span className="text-white">
                    {subscription.durationMonths} {subscription.durationMonths === 1 ? 'mes' : 'meses'}
                  </span>
                </div>
              </div>
            </Card>

            <Card variant="outline" className="bg-dark-800/50">
              <div className="flex items-center gap-3 mb-3">
                <ScissorsIcon className="w-5 h-5 text-primary-400" />
                <h4 className="font-semibold text-white">Pacote</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">Nome:</span>
                  <span className="text-white">{subscription.package?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Plano:</span>
                  <Badge variant="info" size="sm">
                    {subscription.planType === 'WEEKLY' ? 'Semanal' : 'Quinzenal'}
                  </Badge>
                </div>
                {subscription.package?.finalPrice && (
                  <div className="flex justify-between">
                    <span className="text-dark-400">Valor:</span>
                    <span className="text-primary-400 font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subscription.package.finalPrice)}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Progress */}
          <Card variant="outline" className="bg-dark-800/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-primary-400" />
                Progresso
              </h4>
              <span className="text-white font-bold">
                {completedCount} / {subscription.totalSlots}
              </span>
            </div>
            <div className="w-full bg-dark-700 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / subscription.totalSlots) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-dark-400">
              <span>{completedCount} concluido(s)</span>
              <span>{subscription.totalSlots - completedCount} restante(s)</span>
            </div>
          </Card>

          {/* Upcoming Appointments */}
          <Card variant="outline" className="bg-dark-800/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-green-400" />
                Proximos Agendamentos
                <Badge variant="success" size="sm">{upcomingAppointments.length}</Badge>
              </h4>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-6 text-dark-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum agendamento futuro</p>
                {subscription.status === 'PAUSED' && (
                  <p className="text-sm mt-1">Retome a assinatura para gerar novos agendamentos</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingAppointments
                  .slice(0, showAllAppointments ? undefined : 5)
                  .map((apt, index) => (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 rounded-lg border ${
                        isToday(new Date(apt.dateTime))
                          ? 'bg-green-900/20 border-green-700'
                          : 'bg-dark-900 border-dark-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-center min-w-[50px]">
                            <p className="text-lg font-bold text-white">
                              {format(new Date(apt.dateTime), 'dd', { locale: ptBR })}
                            </p>
                            <p className="text-xs text-dark-400 uppercase">
                              {format(new Date(apt.dateTime), 'MMM', { locale: ptBR })}
                            </p>
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {format(new Date(apt.dateTime), "EEEE 'as' HH:mm", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-dark-400">
                              {apt.services?.map(s => s.service.name).join(', ') || 'Servicos do pacote'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isToday(new Date(apt.dateTime)) && (
                            <Badge variant="success" size="sm">Hoje</Badge>
                          )}
                          <Badge
                            variant={appointmentStatusConfig[apt.status].variant}
                            size="sm"
                          >
                            {appointmentStatusConfig[apt.status].label}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                {upcomingAppointments.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllAppointments(!showAllAppointments)}
                    className="w-full mt-2"
                  >
                    {showAllAppointments ? (
                      <>
                        <ChevronUpIcon className="w-4 h-4 mr-2" />
                        Mostrar menos
                      </>
                    ) : (
                      <>
                        <ChevronDownIcon className="w-4 h-4 mr-2" />
                        Ver todos ({upcomingAppointments.length - 5} mais)
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <Card variant="outline" className="bg-dark-800/50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-dark-400" />
                  Historico de Agendamentos
                  <Badge variant="neutral" size="sm">{pastAppointments.length}</Badge>
                </h4>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pastAppointments.slice(0, 5).map((apt, index) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-2 bg-dark-900/50 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-dark-400">
                        {format(new Date(apt.dateTime), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    <Badge
                      variant={appointmentStatusConfig[apt.status].variant}
                      size="sm"
                    >
                      {appointmentStatusConfig[apt.status].label}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Change Logs */}
          {subscription.changeLogs && subscription.changeLogs.length > 0 && (
            <Card variant="outline" className="bg-dark-800/50">
              <button
                onClick={() => setShowChangeLogs(!showChangeLogs)}
                className="w-full flex items-center justify-between"
              >
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-primary-400" />
                  Historico de Alteracoes
                  <Badge variant="neutral" size="sm">{subscription.changeLogs.length}</Badge>
                </h4>
                {showChangeLogs ? (
                  <ChevronUpIcon className="w-5 h-5 text-dark-400" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-dark-400" />
                )}
              </button>

              <AnimatePresence>
                {showChangeLogs && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 space-y-2 max-h-48 overflow-y-auto"
                  >
                    {subscription.changeLogs.map((log, index) => (
                      <div
                        key={log.id}
                        className="p-2 bg-dark-900/50 rounded-lg text-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="info" size="sm">
                            {changeTypeLabels[log.changeType] || log.changeType}
                          </Badge>
                          <span className="text-xs text-dark-400">
                            {format(new Date(log.createdAt), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-dark-300">{log.description}</p>
                        {log.reason && (
                          <p className="text-xs text-dark-400 mt-1">
                            Motivo: {log.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Notes */}
          {subscription.notes && (
            <Card variant="outline" className="bg-dark-800/50">
              <h4 className="font-semibold text-white mb-2">Observacoes</h4>
              <p className="text-dark-300 text-sm">{subscription.notes}</p>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-dark-700">
            <Button
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
            >
              Fechar
            </Button>

            {subscription.status === 'ACTIVE' && onPause && (
              <Button
                variant="secondary"
                onClick={() => {
                  handleClose();
                  onPause();
                }}
                className="flex-1 !bg-yellow-600 hover:!bg-yellow-700"
              >
                <PauseCircleIcon className="w-5 h-5 mr-2" />
                Pausar
              </Button>
            )}

            {subscription.status === 'PAUSED' && onResume && (
              <Button
                onClick={() => {
                  handleClose();
                  onResume();
                }}
                className="flex-1"
              >
                <PlayCircleIcon className="w-5 h-5 mr-2" />
                Retomar
              </Button>
            )}

            {(subscription.status === 'ACTIVE' || subscription.status === 'PAUSED') && onCancel && (
              <Button
                variant="danger"
                onClick={() => {
                  handleClose();
                  onCancel();
                }}
                className="flex-1"
              >
                <XCircleIcon className="w-5 h-5 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-dark-400">
          Assinatura nao encontrada
        </div>
      )}
    </Modal>
  );
}
