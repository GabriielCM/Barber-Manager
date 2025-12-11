'use client';

import { useState, useMemo } from 'react';
import { Subscription } from '@/types/subscription';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  Modal,
  RadioGroup,
  Textarea,
  Button,
  Card,
  Badge,
  FadeIn,
} from '@/components/ui';
import {
  PlusCircleIcon,
  CalendarIcon,
  ClockIcon,
  InformationCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscription: Subscription | null;
}

const SLOTS_PER_MONTH = 4;

const extensionOptions = [
  { value: '1', label: '1 mes (+4 agendamentos)' },
  { value: '2', label: '2 meses (+8 agendamentos)' },
  { value: '3', label: '3 meses (+12 agendamentos)' },
  { value: '6', label: '6 meses (+24 agendamentos)' },
];

export function ExtendSubscriptionModal({ isOpen, onClose, onSuccess, subscription }: Props) {
  const [extensionMonths, setExtensionMonths] = useState('1');
  const [reason, setReason] = useState('');

  const { extendSubscription, loading } = useSubscriptions();

  if (!subscription) return null;

  const planTypeLabel = subscription.planType === 'WEEKLY' ? 'Semanal' : 'Quinzenal';
  const intervalDays = subscription.planType === 'WEEKLY' ? 7 : 14;
  const newSlots = parseInt(extensionMonths) * SLOTS_PER_MONTH;

  const handleClose = () => {
    setExtensionMonths('1');
    setReason('');
    onClose();
  };

  const handleExtend = async () => {
    try {
      await extendSubscription(
        subscription.id,
        parseInt(extensionMonths),
        reason || undefined
      );
      onSuccess();
      handleClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  // Calculate preview of new appointments
  const previewInfo = useMemo(() => {
    const existingAppointments = subscription.appointments || [];
    const futureAppointments = existingAppointments
      .filter((apt: any) => apt.status === 'SCHEDULED' || apt.status === 'IN_PROGRESS')
      .sort((a: any, b: any) => new Date(b.dateTime || b.date).getTime() - new Date(a.dateTime || a.date).getTime());

    let startDate: Date;
    if (futureAppointments.length > 0) {
      const lastDate = new Date(futureAppointments[0].dateTime || futureAppointments[0].date);
      startDate = addDays(lastDate, intervalDays);
    } else {
      startDate = addDays(new Date(), 1);
    }

    // Generate preview dates for new appointments
    const previewDates: Date[] = [];
    for (let i = 0; i < Math.min(newSlots, 4); i++) {
      previewDates.push(addDays(startDate, i * intervalDays));
    }

    // Calculate new end date
    const currentEndDate = new Date(subscription.endDate);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + parseInt(extensionMonths));

    return {
      previewDates,
      newEndDate,
      newTotalSlots: subscription.totalSlots + newSlots,
      newDurationMonths: subscription.durationMonths + parseInt(extensionMonths),
    };
  }, [subscription, extensionMonths, intervalDays, newSlots]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Estender Assinatura" size="lg">
      <div className="space-y-6">
        {/* Subscription Info */}
        <Card variant="outline" className="bg-dark-800/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white">Assinatura Atual</h4>
            <Badge variant="success">Ativa</Badge>
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
              <span className="text-dark-400">Duracao atual:</span>
              <p className="text-white">{subscription.durationMonths} mes(es)</p>
            </div>
            <div>
              <span className="text-dark-400">Agendamentos:</span>
              <p className="text-white">{subscription.completedSlots || 0} / {subscription.totalSlots}</p>
            </div>
          </div>
        </Card>

        {/* Info about extension */}
        <Card className="bg-blue-900/20 border-blue-700">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="w-6 h-6 text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-white font-medium">Como funciona a extensao</p>
              <p className="text-dark-300 text-sm mt-1">
                Cada mes adiciona <span className="text-blue-400 font-semibold">{SLOTS_PER_MONTH} agendamentos</span> a assinatura.
                Os novos agendamentos serao criados automaticamente apos o ultimo agendamento existente,
                seguindo o plano <span className="text-blue-400">{planTypeLabel}</span> (a cada {intervalDays} dias).
              </p>
            </div>
          </div>
        </Card>

        {/* Extension Selection */}
        <div className="space-y-4">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <PlusCircleIcon className="w-5 h-5 text-primary-400" />
            Tempo de Extensao
          </h4>

          <RadioGroup
            name="extensionMonths"
            value={extensionMonths}
            onChange={setExtensionMonths}
            options={extensionOptions}
            direction="vertical"
          />

          <Textarea
            label="Motivo (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Cliente solicitou extensao por satisfacao com o servico..."
            rows={2}
          />
        </div>

        {/* Preview */}
        <FadeIn>
          <Card className="bg-gradient-to-r from-primary-900/30 to-primary-800/20 border-primary-700/50">
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="w-5 h-5 text-primary-400" />
              <h4 className="font-semibold text-primary-300">Previa da Extensao</h4>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-dark-400">Novos agendamentos:</span>
                <p className="text-white font-bold text-lg">+{newSlots}</p>
              </div>
              <div>
                <span className="text-dark-400">Total de agendamentos:</span>
                <p className="text-white font-bold text-lg">{previewInfo.newTotalSlots}</p>
              </div>
              <div>
                <span className="text-dark-400">Nova duracao:</span>
                <p className="text-white">{previewInfo.newDurationMonths} mes(es)</p>
              </div>
              <div>
                <span className="text-dark-400">Nova data final:</span>
                <p className="text-white">
                  {format(previewInfo.newEndDate, 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Preview of first new appointments */}
            <div className="border-t border-dark-700 pt-4">
              <p className="text-sm text-dark-400 mb-2 flex items-center gap-2">
                <ClockIcon className="w-4 h-4" />
                Primeiros novos agendamentos:
              </p>
              <div className="space-y-1">
                {previewInfo.previewDates.map((date, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-white"
                  >
                    <span className="text-primary-400">#{subscription.totalSlots + index + 1}</span>
                    <span>
                      {format(date, "EEEE, dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                ))}
                {newSlots > 4 && (
                  <p className="text-dark-400 text-xs mt-1">
                    +{newSlots - 4} agendamentos adicionais...
                  </p>
                )}
              </div>
            </div>
          </Card>
        </FadeIn>

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
            onClick={handleExtend}
            className="flex-1"
            isLoading={loading}
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Estender Assinatura
          </Button>
        </div>
      </div>
    </Modal>
  );
}
