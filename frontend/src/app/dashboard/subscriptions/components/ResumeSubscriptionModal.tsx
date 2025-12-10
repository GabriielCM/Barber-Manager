'use client';

import { useState } from 'react';
import { Subscription } from '@/types/subscription';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  Modal,
  DatePicker,
  TimePicker,
  Textarea,
  Button,
  Card,
  Badge,
  FadeIn,
} from '@/components/ui';
import {
  PlayIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscription: Subscription | null;
}

export function ResumeSubscriptionModal({ isOpen, onClose, onSuccess, subscription }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>('09:00');
  const [reason, setReason] = useState('');

  const { resumeSubscription, loading } = useSubscriptions();

  if (!subscription) return null;

  const remainingSlots = subscription.totalSlots - (subscription.completedSlots || 0);
  const planTypeLabel = subscription.planType === 'WEEKLY' ? 'Semanal' : 'Quinzenal';
  const intervalDays = subscription.planType === 'WEEKLY' ? 7 : 14;

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedTime('09:00');
    setReason('');
    onClose();
  };

  const handleResume = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Selecione a data e horário para retomar');
      return;
    }

    const dateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    dateTime.setHours(parseInt(hours), parseInt(minutes));

    try {
      await resumeSubscription(
        subscription.id,
        dateTime.toISOString(),
        reason || 'Assinatura retomada pelo usuário'
      );
      toast.success('Assinatura retomada com sucesso!');
      onSuccess();
      handleClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  // Calculate preview of next appointments
  const getPreviewDates = () => {
    if (!selectedDate || !selectedTime) return [];

    const dates = [];
    const startDate = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    startDate.setHours(parseInt(hours), parseInt(minutes));

    for (let i = 0; i < Math.min(remainingSlots, 5); i++) {
      const date = addDays(startDate, i * intervalDays);
      dates.push(date);
    }
    return dates;
  };

  const previewDates = getPreviewDates();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Retomar Assinatura" size="lg">
      <div className="space-y-6">
        {/* Subscription Info */}
        <Card variant="outline" className="bg-dark-800/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white">Informacoes da Assinatura</h4>
            <Badge variant="warning">Pausada</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-dark-400">Cliente:</span>
              <p className="text-white font-medium">{subscription.client?.name}</p>
            </div>
            <div>
              <span className="text-dark-400">Barbeiro:</span>
              <p className="text-white font-medium">{subscription.barber?.name}</p>
            </div>
            <div>
              <span className="text-dark-400">Pacote:</span>
              <p className="text-white">{subscription.package?.name || '-'}</p>
            </div>
            <div>
              <span className="text-dark-400">Plano:</span>
              <p className="text-white">{planTypeLabel}</p>
            </div>
          </div>
        </Card>

        {/* Progress Info */}
        <Card className="bg-blue-900/20 border-blue-700">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="w-6 h-6 text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-white font-medium">Agendamentos Restantes</p>
              <p className="text-dark-300 text-sm mt-1">
                Esta assinatura tem <span className="text-blue-400 font-semibold">{remainingSlots}</span> agendamento(s)
                restante(s) de um total de {subscription.totalSlots}.
              </p>
              <p className="text-dark-400 text-xs mt-2">
                Pausada em: {subscription.pausedAt
                  ? format(new Date(subscription.pausedAt), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })
                  : '-'
                }
              </p>
            </div>
          </div>
        </Card>

        {/* Warning if few slots remaining */}
        {remainingSlots <= 2 && (
          <Card className="bg-yellow-900/20 border-yellow-700">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Poucos Agendamentos Restantes</p>
                <p className="text-dark-300 text-sm mt-1">
                  A assinatura esta proxima do fim. Considere renovar apos a conclusao.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Date Selection */}
        <div className="space-y-4">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary-400" />
            Nova Data de Inicio
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              label="Data"
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Selecione a data"
              minDate={new Date()}
              required
            />

            <TimePicker
              label="Horario"
              value={selectedTime}
              onChange={setSelectedTime}
              placeholder="Selecione o horario"
              interval={30}
              minTime="08:00"
              maxTime="20:00"
              required
            />
          </div>

          <Textarea
            label="Motivo (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Cliente solicitou retomada..."
            rows={2}
          />
        </div>

        {/* Preview of New Appointments */}
        {previewDates.length > 0 && (
          <FadeIn>
            <Card variant="outline" className="bg-dark-800/50">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-primary-400" />
                Previsao dos Proximos Agendamentos
              </h4>
              <div className="space-y-2">
                {previewDates.map((date, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-dark-900 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-primary-400 font-medium">#{index + 1}</span>
                      <span className="text-white text-sm">
                        {format(date, "EEEE, dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {index === 0 && (
                      <Badge variant="success" size="sm">Proximo</Badge>
                    )}
                  </div>
                ))}
                {remainingSlots > 5 && (
                  <p className="text-dark-400 text-sm text-center py-2">
                    +{remainingSlots - 5} agendamentos restantes...
                  </p>
                )}
              </div>
            </Card>
          </FadeIn>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-dark-700">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleResume}
            className="flex-1"
            isLoading={loading}
            disabled={!selectedDate || !selectedTime}
          >
            <PlayIcon className="w-5 h-5 mr-2" />
            Retomar Assinatura
          </Button>
        </div>
      </div>
    </Modal>
  );
}
