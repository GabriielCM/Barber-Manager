'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { SubscriptionPlanType, AppointmentAdjustment } from '@/types/subscription';
import { Package } from '@/types/package';
import { clientsApi, barbersApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Modal,
  SearchableSelect,
  RadioGroup,
  DatePicker,
  TimePicker,
  Textarea,
  Button,
  Card,
  Badge,
  FormStepsProvider,
  StepperIndicator,
  StepProgressBar,
  StepPanel,
  StepNavigation,
  AnimatedCurrency,
  FadeIn,
} from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import {
  UserIcon,
  ScissorsIcon,
  CubeIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Steps definition
const STEPS = [
  { id: 'client', title: 'Cliente', description: 'Selecione cliente e barbeiro', icon: <UserIcon className="w-5 h-5" /> },
  { id: 'package', title: 'Pacote', description: 'Escolha o pacote', icon: <CubeIcon className="w-5 h-5" /> },
  { id: 'schedule', title: 'Agendamento', description: 'Data e horário', icon: <CalendarIcon className="w-5 h-5" /> },
  { id: 'preview', title: 'Confirmação', description: 'Revise e confirme', icon: <CheckCircleIcon className="w-5 h-5" /> },
];

const durationOptions = [
  { value: '1', label: '1 mês' },
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
];

export function CreateSubscriptionModal({ isOpen, onClose, onSuccess }: Props) {
  const [clients, setClients] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>('09:00');
  const [durationMonths, setDurationMonths] = useState('1');
  const [notes, setNotes] = useState('');

  // Preview state
  const [preview, setPreview] = useState<any>(null);
  const [adjustedDates, setAdjustedDates] = useState<{ [key: number]: string }>({});
  const [showAdjustments, setShowAdjustments] = useState(false);

  const { previewSubscription, createSubscription, loading } = useSubscriptions();

  // Get selected entities
  const selectedClient = useMemo(
    () => clients.find(c => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  const selectedBarber = useMemo(
    () => barbers.find(b => b.id === selectedBarberId),
    [barbers, selectedBarberId]
  );

  const selectedPackage = useMemo(
    () => packages.find(p => p.id === selectedPackageId),
    [packages, selectedPackageId]
  );

  // Build options for selects
  const clientOptions: SelectOption<string>[] = useMemo(
    () => clients.map(c => ({
      value: c.id,
      label: c.name,
      description: c.phone,
    })),
    [clients]
  );

  const barberOptions: SelectOption<string>[] = useMemo(
    () => barbers.map(b => ({
      value: b.id,
      label: b.name,
      description: b.specialties?.join(', ') || 'Barbeiro',
    })),
    [barbers]
  );

  const packageOptions: SelectOption<string>[] = useMemo(
    () => packages.map(p => ({
      value: p.id,
      label: p.name,
      description: `${p.planType === 'WEEKLY' ? 'Semanal' : 'Quinzenal'} - R$ ${p.finalPrice.toFixed(2)}`,
    })),
    [packages]
  );

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;
      setLoadingData(true);
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
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [isOpen]);

  // Reset form when closing
  const handleClose = () => {
    setSelectedClientId(null);
    setSelectedBarberId(null);
    setSelectedPackageId(null);
    setSelectedDate(null);
    setSelectedTime('09:00');
    setDurationMonths('1');
    setNotes('');
    setPreview(null);
    setAdjustedDates({});
    setShowAdjustments(false);
    onClose();
  };

  // Generate preview
  const handleGeneratePreview = async () => {
    if (!selectedClientId || !selectedBarberId || !selectedPackageId || !selectedDate || !selectedTime) {
      toast.error('Preencha todos os campos obrigatórios');
      return false;
    }

    const dateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    dateTime.setHours(parseInt(hours), parseInt(minutes));

    const previewData = {
      clientId: selectedClientId,
      barberId: selectedBarberId,
      packageId: selectedPackageId,
      startDate: dateTime.toISOString(),
      durationMonths: parseInt(durationMonths),
      notes,
    };

    const result = await previewSubscription(previewData);
    if (result) {
      setPreview({ ...result, formData: previewData });
      if (result.hasAnyConflict) {
        setShowAdjustments(true);
        toast(`${result.conflictCount} conflito(s) encontrado(s). Ajuste as datas.`, { icon: '⚠️' });
      }
      return true;
    }
    return false;
  };

  // Create subscription
  const handleCreateSubscription = async () => {
    if (!preview) return;

    const adjustments: AppointmentAdjustment[] = Object.entries(adjustedDates).map(
      ([slotIndex, newDate]) => ({
        slotIndex: parseInt(slotIndex),
        newDate: new Date(newDate).toISOString(),
        reason: 'Ajustado devido a conflito',
      })
    );

    try {
      await createSubscription(
        preview.formData,
        adjustments.length > 0 ? { adjustments } : undefined
      );
      toast.success('Assinatura criada com sucesso!');
      onSuccess();
      handleClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nova Assinatura" size="xl">
      <FormStepsProvider steps={STEPS} initialStep={0}>
        <div className="space-y-6">
          <StepProgressBar showLabel showPercentage />
          <StepperIndicator variant="default" clickable />

          {/* Step 1: Client & Barber */}
          <StepPanel stepIndex={0}>
            <div className="space-y-4">
              <SearchableSelect
                label="Cliente"
                value={selectedClientId}
                onChange={setSelectedClientId}
                options={clientOptions}
                placeholder={loadingData ? 'Carregando...' : 'Buscar cliente...'}
                disabled={loadingData}
                required
              />

              <SearchableSelect
                label="Barbeiro"
                value={selectedBarberId}
                onChange={setSelectedBarberId}
                options={barberOptions}
                placeholder={loadingData ? 'Carregando...' : 'Selecionar barbeiro...'}
                disabled={loadingData}
                required
              />

              {selectedClient && selectedBarber && (
                <FadeIn>
                  <Card variant="outline" className="bg-dark-800/50">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-dark-400">Cliente</p>
                        <p className="text-white font-medium">{selectedClient.name}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-dark-400">Barbeiro</p>
                        <p className="text-white font-medium">{selectedBarber.name}</p>
                      </div>
                    </div>
                  </Card>
                </FadeIn>
              )}
            </div>
          </StepPanel>

          {/* Step 2: Package */}
          <StepPanel stepIndex={1}>
            <div className="space-y-4">
              <SearchableSelect
                label="Pacote"
                value={selectedPackageId}
                onChange={setSelectedPackageId}
                options={packageOptions}
                placeholder={loadingData ? 'Carregando...' : 'Selecionar pacote...'}
                disabled={loadingData}
                required
              />

              <AnimatePresence>
                {selectedPackage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Card className="bg-gradient-to-r from-primary-900/30 to-primary-800/20 border-primary-700/50">
                      <h4 className="font-semibold text-primary-300 mb-3">Detalhes do Pacote</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-dark-400">Frequência:</span>
                          <Badge variant="info">
                            {selectedPackage.planType === 'WEEKLY' ? 'Semanal (7 dias)' : 'Quinzenal (14 dias)'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-dark-400 mb-1">Serviços incluídos:</p>
                          <ul className="space-y-1 ml-4">
                            {selectedPackage.services.map(service => (
                              <li key={service.id} className="flex items-center gap-2 text-white">
                                <ScissorsIcon className="w-4 h-4 text-primary-400" />
                                {service.name} ({service.duration} min)
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-dark-700">
                          <span className="text-dark-400">Duração por sessão:</span>
                          <span className="text-white font-medium">
                            {selectedPackage.services.reduce((sum, s) => sum + s.duration, 0)} min
                          </span>
                        </div>
                        {selectedPackage.discountAmount > 0 && (
                          <div className="flex justify-between text-green-400">
                            <span>Desconto:</span>
                            <span>- R$ {selectedPackage.discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-dark-700">
                          <span className="text-white">Total:</span>
                          <AnimatedCurrency
                            value={selectedPackage.finalPrice}
                            className="text-primary-400"
                          />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </StepPanel>

          {/* Step 3: Schedule */}
          <StepPanel stepIndex={2}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Duração da Assinatura <span className="text-red-500">*</span>
                </label>
                <RadioGroup
                  name="durationMonths"
                  value={durationMonths}
                  onChange={setDurationMonths}
                  options={durationOptions}
                  direction="horizontal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="Data de Início"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  placeholder="Selecione a data"
                  minDate={new Date()}
                  required
                />

                <TimePicker
                  label="Horário"
                  value={selectedTime}
                  onChange={setSelectedTime}
                  placeholder="Selecione o horário"
                  interval={30}
                  minTime="08:00"
                  maxTime="20:00"
                  required
                />
              </div>

              <Textarea
                label="Observações"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre a assinatura..."
                rows={3}
              />

              {selectedDate && selectedTime && selectedPackage && (
                <FadeIn>
                  <Card variant="outline" className="bg-dark-800/50">
                    <h4 className="text-sm font-medium text-dark-300 mb-2">Resumo do Agendamento</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-dark-400">Início:</span>
                        <span className="text-white">
                          {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às {selectedTime}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-400">Frequência:</span>
                        <span className="text-white">
                          A cada {selectedPackage.planType === 'WEEKLY' ? '7' : '14'} dias
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-400">Duração:</span>
                        <span className="text-white">{durationMonths} mês(es)</span>
                      </div>
                    </div>
                  </Card>
                </FadeIn>
              )}
            </div>
          </StepPanel>

          {/* Step 4: Preview & Confirm */}
          <StepPanel stepIndex={3}>
            {!preview ? (
              <div className="text-center py-8">
                <Button
                  onClick={handleGeneratePreview}
                  isLoading={loading}
                  size="lg"
                >
                  Gerar Prévia dos Agendamentos
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Conflict Warning */}
                {preview.hasAnyConflict && showAdjustments && (
                  <FadeIn>
                    <Card className="bg-yellow-900/20 border-yellow-700">
                      <div className="flex items-start gap-3">
                        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                        <div>
                          <p className="text-white font-medium">
                            {preview.conflictCount} conflito(s) encontrado(s)
                          </p>
                          <p className="text-dark-300 text-sm mt-1">
                            Ajuste as datas abaixo para resolver os conflitos.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </FadeIn>
                )}

                {/* Adjustments Panel */}
                {showAdjustments && preview.appointments.some((a: any) => a.hasConflict) && (
                  <Card variant="outline" className="bg-dark-800/50">
                    <h4 className="font-semibold text-white mb-3">Ajustar Conflitos</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {preview.appointments
                        .filter((apt: any) => apt.hasConflict)
                        .map((apt: any) => (
                          <div key={apt.slotIndex} className="p-3 bg-dark-900 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-white text-sm font-medium">
                                  Agendamento #{apt.slotIndex + 1}
                                </p>
                                <p className="text-xs text-red-400">
                                  Conflito: {apt.conflictDetails?.existingClientName}
                                </p>
                              </div>
                              <Badge variant="danger" size="sm">Conflito</Badge>
                            </div>
                            <p className="text-xs text-dark-400 mb-2">
                              Original: {format(new Date(apt.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            <input
                              type="datetime-local"
                              value={adjustedDates[apt.slotIndex] || ''}
                              onChange={(e) =>
                                setAdjustedDates({ ...adjustedDates, [apt.slotIndex]: e.target.value })
                              }
                              className="w-full px-3 py-2 text-sm bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        ))}
                    </div>
                    <Button
                      onClick={() => setShowAdjustments(false)}
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                      disabled={
                        Object.keys(adjustedDates).length !==
                        preview.appointments.filter((a: any) => a.hasConflict).length
                      }
                    >
                      Confirmar Ajustes
                    </Button>
                  </Card>
                )}

                {/* Summary */}
                <Card variant="outline" className="bg-dark-800/50">
                  <h4 className="font-semibold text-white mb-3">Resumo da Assinatura</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dark-400">Cliente:</span>
                      <span className="text-white">{selectedClient?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Barbeiro:</span>
                      <span className="text-white">{selectedBarber?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Pacote:</span>
                      <span className="text-white">{selectedPackage?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Plano:</span>
                      <Badge variant="info">
                        {preview.subscription.planType === 'WEEKLY' ? 'Semanal' : 'Quinzenal'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Duração:</span>
                      <span className="text-white">{preview.subscription.durationMonths} meses</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Total de Agendamentos:</span>
                      <span className="text-white font-semibold">{preview.subscription.totalSlots}</span>
                    </div>
                  </div>
                </Card>

                {/* Appointments List */}
                <Card variant="outline" className="bg-dark-800/50">
                  <h4 className="font-semibold text-white mb-3">
                    Agendamentos ({preview.appointments.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {preview.appointments.slice(0, 10).map((apt: any, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          apt.hasConflict && !adjustedDates[apt.slotIndex]
                            ? 'bg-red-900/20 border border-red-500/50'
                            : 'bg-dark-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-dark-400" />
                          <span className="text-white text-sm">
                            #{index + 1}: {format(new Date(apt.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        {apt.hasConflict && !adjustedDates[apt.slotIndex] && (
                          <Badge variant="danger" size="sm">Conflito</Badge>
                        )}
                        {adjustedDates[apt.slotIndex] && (
                          <Badge variant="success" size="sm">Ajustado</Badge>
                        )}
                      </motion.div>
                    ))}
                    {preview.appointments.length > 10 && (
                      <p className="text-dark-400 text-sm text-center py-2">
                        +{preview.appointments.length - 10} agendamentos...
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </StepPanel>

          {/* Navigation */}
          <StepNavigation
            onNext={async () => {
              // On last step, generate preview if not exists
              return true;
            }}
            onComplete={handleCreateSubscription}
            isCompleteLoading={loading}
            isNextDisabled={loading}
            completeLabel="Criar Assinatura"
          />
        </div>
      </FormStepsProvider>
    </Modal>
  );
}
