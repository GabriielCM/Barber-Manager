'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { SubscriptionPlanType, AppointmentAdjustment } from '@/types/subscription';
import { clientsApi, barbersApi, servicesApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'FORM' | 'PREVIEW' | 'ADJUST';

export function CreateSubscriptionModal({ isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('FORM');
  const [clients, setClients] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [preview, setPreview] = useState<any>(null);
  const [adjustments, setAdjustments] = useState<AppointmentAdjustment[]>([]);
  const [adjustedDates, setAdjustedDates] = useState<{ [key: number]: string }>({});

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const { previewSubscription, createSubscription, loading } = useSubscriptions();

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsRes, barbersRes, servicesRes] = await Promise.all([
          clientsApi.getAll({ status: 'ACTIVE', take: 100 }),
          barbersApi.getAll(true),
          servicesApi.getAll(true),
        ]);
        setClients(clientsRes.data.clients || []);
        setBarbers(barbersRes.data || []);
        setServices(servicesRes.data || []);
      } catch (error) {
        toast.error('Erro ao carregar dados');
      }
    };
    if (isOpen) loadData();
  }, [isOpen]);

  const handleGeneratePreview = async (data: any) => {
    const previewData = {
      clientId: data.clientId,
      barberId: data.barberId,
      serviceId: data.serviceId,
      planType: data.planType,
      startDate: new Date(`${data.date}T${data.time}`).toISOString(),
      durationMonths: parseInt(data.durationMonths),
      notes: data.notes,
    };

    const result = await previewSubscription(previewData);
    if (result) {
      setPreview({ ...result, formData: previewData });
      if (result.hasAnyConflict) {
        setStep('ADJUST');
        toast.warning(`${result.conflictCount} conflito(s) encontrado(s). Ajuste as datas.`);
      } else {
        setStep('PREVIEW');
      }
    }
  };

  const handleConfirmAdjustments = () => {
    const adjustmentsList: AppointmentAdjustment[] = Object.entries(adjustedDates).map(
      ([slotIndex, newDate]) => ({
        slotIndex: parseInt(slotIndex),
        newDate: new Date(newDate).toISOString(),
        reason: 'Ajustado devido a conflito',
      })
    );
    setAdjustments(adjustmentsList);
    setStep('PREVIEW');
  };

  const handleCreateSubscription = async () => {
    try {
      await createSubscription(
        preview.formData,
        adjustments.length > 0 ? { adjustments } : undefined
      );
      onSuccess();
    } catch (error) {
      // Error handled by hook
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit(handleGeneratePreview)} className="space-y-4">

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Cliente *
        </label>
        <select
          {...register('clientId', { required: 'Selecione um cliente' })}
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2"
        >
          <option value="">Selecione...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        {errors.clientId && (
          <p className="text-red-400 text-sm mt-1">{errors.clientId.message as string}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Barbeiro *
        </label>
        <select
          {...register('barberId', { required: 'Selecione um barbeiro' })}
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2"
        >
          <option value="">Selecione...</option>
          {barbers.map((barber) => (
            <option key={barber.id} value={barber.id}>
              {barber.name}
            </option>
          ))}
        </select>
        {errors.barberId && (
          <p className="text-red-400 text-sm mt-1">{errors.barberId.message as string}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Serviço *
        </label>
        <select
          {...register('serviceId', { required: 'Selecione um serviço' })}
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2"
        >
          <option value="">Selecione...</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} - R$ {service.price}
            </option>
          ))}
        </select>
        {errors.serviceId && (
          <p className="text-red-400 text-sm mt-1">{errors.serviceId.message as string}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Tipo de Plano *
          </label>
          <select
            {...register('planType', { required: true })}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2"
          >
            <option value="WEEKLY">Semanal (7 dias)</option>
            <option value="BIWEEKLY">Quinzenal (14 dias)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Duração *
          </label>
          <select
            {...register('durationMonths', { required: true })}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2"
          >
            <option value="1">1 mês</option>
            <option value="3">3 meses</option>
            <option value="6">6 meses</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Data Início *
          </label>
          <input
            type="date"
            {...register('date', { required: true })}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Hora *
          </label>
          <input
            type="time"
            {...register('time', { required: true })}
            defaultValue="09:00"
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Observações
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2"
          placeholder="Observações sobre a assinatura..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Gerando...' : 'Gerar Prévia'}
        </button>
      </div>
    </form>
  );

  const renderAdjust = () => (
    <div>
      <p className="text-red-400 mb-4">
        {preview.conflictCount} conflito(s) encontrado(s). Ajuste as datas abaixo:
      </p>

      <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
        {preview.appointments
          .filter((apt: any) => apt.hasConflict)
          .map((apt: any) => (
            <div key={apt.slotIndex} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-white font-medium">Agendamento #{apt.slotIndex + 1}</p>
                  <p className="text-sm text-red-400">
                    Conflito com: {apt.conflictDetails?.existingClientName}
                  </p>
                </div>
                <span className="text-red-400 text-xs">CONFLITO</span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  Data original: {format(new Date(apt.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                <input
                  type="datetime-local"
                  value={adjustedDates[apt.slotIndex] || ''}
                  onChange={(e) =>
                    setAdjustedDates({ ...adjustedDates, [apt.slotIndex]: e.target.value })
                  }
                  className="w-full bg-gray-600 border border-gray-500 text-white rounded-lg px-3 py-2"
                />
              </div>
            </div>
          ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('FORM')}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          Voltar
        </button>
        <button
          onClick={handleConfirmAdjustments}
          disabled={
            Object.keys(adjustedDates).length !==
            preview.appointments.filter((a: any) => a.hasConflict).length
          }
          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Confirmar Ajustes
        </button>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div>

      <div className="bg-gray-700 p-4 rounded-lg mb-4">
        <h3 className="text-lg font-semibold text-white mb-3">Resumo</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Plano:</span>
            <span className="text-white">
              {preview.subscription.planType === 'WEEKLY' ? 'Semanal' : 'Quinzenal'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Duração:</span>
            <span className="text-white">{preview.subscription.durationMonths} meses</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total de Agendamentos:</span>
            <span className="text-white font-semibold">{preview.subscription.totalSlots}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Intervalo:</span>
            <span className="text-white">{preview.subscription.intervalDays} dias</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-3">
          Agendamentos Gerados ({preview.appointments.length})
        </h3>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {preview.appointments.slice(0, 10).map((apt: any, index: number) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                apt.hasConflict ? 'bg-red-900/30 border border-red-500' : 'bg-gray-700'
              }`}
            >
              <p className="text-white text-sm">
                #{index + 1}: {format(new Date(apt.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          ))}
          {preview.appointments.length > 10 && (
            <p className="text-gray-400 text-sm text-center">
              +{preview.appointments.length - 10} agendamentos...
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep(preview.hasAnyConflict ? 'ADJUST' : 'FORM')}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          Voltar
        </button>
        <button
          onClick={handleCreateSubscription}
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Criando...' : 'Confirmar Criação'}
        </button>
      </div>
    </div>
  );

  const getTitle = () => {
    switch (step) {
      case 'FORM':
        return 'Nova Assinatura';
      case 'ADJUST':
        return 'Ajustar Conflitos';
      case 'PREVIEW':
        return 'Prévia da Assinatura';
      default:
        return 'Assinatura';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title={getTitle()}>
      <div className="p-6">
        {step === 'FORM' && renderForm()}
        {step === 'ADJUST' && renderAdjust()}
        {step === 'PREVIEW' && renderPreview()}
      </div>
    </Modal>
  );
}
