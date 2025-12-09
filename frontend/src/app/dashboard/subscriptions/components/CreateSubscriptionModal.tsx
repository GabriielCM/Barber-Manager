'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { SubscriptionPlanType, AppointmentAdjustment } from '@/types/subscription';
import { Package } from '@/types/package';
import { clientsApi, barbersApi } from '@/lib/api';
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
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [adjustments, setAdjustments] = useState<AppointmentAdjustment[]>([]);
  const [adjustedDates, setAdjustedDates] = useState<{ [key: number]: string }>({});

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const { previewSubscription, createSubscription, loading } = useSubscriptions();

  const watchPackageId = watch('packageId');

  // Update selected package when packageId changes
  useEffect(() => {
    const updateSelectedPackage = () => {
      if (watchPackageId) {
        const pkg = packages.find(p => p.id === watchPackageId);
        setSelectedPackage(pkg || null);
      } else {
        setSelectedPackage(null);
      }
    };

    updateSelectedPackage();
  }, [watchPackageId, packages]);

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsRes, barbersRes, packagesRes] = await Promise.all([
          clientsApi.getAll({ status: 'ACTIVE', take: 100 }),
          barbersApi.getAll(true),
          fetch('http://localhost:3001/api/packages?isActive=true', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }).then(r => r.json()),
        ]);
        setClients(clientsRes.data.clients || []);
        setBarbers(barbersRes.data || []);
        setPackages(packagesRes || []);
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
      packageId: data.packageId,
      startDate: new Date(`${data.date}T${data.time}`).toISOString(),
      durationMonths: parseInt(data.durationMonths),
      notes: data.notes,
    };

    const result = await previewSubscription(previewData);
    if (result) {
      setPreview({ ...result, formData: previewData });
      if (result.hasAnyConflict) {
        setStep('ADJUST');
        toast(`${result.conflictCount} conflito(s) encontrado(s). Ajuste as datas.`, { icon: '⚠️' });
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
          Pacote *
        </label>
        <select
          {...register('packageId', { required: 'Selecione um pacote' })}
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2"
        >
          <option value="">Selecione...</option>
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name} ({pkg.planType === 'WEEKLY' ? 'Semanal' : 'Quinzenal'}) - R$ {pkg.finalPrice.toFixed(2)}
              {pkg.discountAmount > 0 && ` (Desconto: R$ ${pkg.discountAmount.toFixed(2)})`}
            </option>
          ))}
        </select>
        {errors.packageId && (
          <p className="text-red-400 text-sm mt-1">{errors.packageId.message as string}</p>
        )}
      </div>

      {/* Mostrar detalhes do pacote selecionado */}
      {selectedPackage && (
        <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4">
          <h4 className="font-semibold text-blue-300 mb-2">Detalhes do Pacote</h4>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Frequência:</span>
              <span className="font-medium">
                {selectedPackage.planType === 'WEEKLY' ? 'Semanal (a cada 7 dias)' : 'Quinzenal (a cada 14 dias)'}
              </span>
            </div>
            <div>
              <p className="font-medium mb-1">Serviços incluídos:</p>
              <ul className="list-disc ml-5 space-y-1">
                {selectedPackage.services.map(service => (
                  <li key={service.id}>
                    {service.name} ({service.duration} min)
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between pt-2 border-t border-blue-700">
              <span>Duração total por agendamento:</span>
              <span className="font-medium">
                {selectedPackage.services.reduce((sum, s) => sum + s.duration, 0)} minutos
              </span>
            </div>
            <div className="flex justify-between">
              <span>Preço base:</span>
              <span>R$ {selectedPackage.basePrice.toFixed(2)}</span>
            </div>
            {selectedPackage.discountAmount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Desconto:</span>
                <span>- R$ {selectedPackage.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-blue-700">
              <span>Total:</span>
              <span className="text-blue-300">R$ {selectedPackage.finalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

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
