'use client';

import { useState, useEffect, useMemo } from 'react';
import { CreatePackageRequest, SubscriptionPlanType } from '@/types/package';
import {
  Modal,
  Input,
  Textarea,
  RadioGroup,
  MultiSelect,
  CurrencyInput,
  FormStepsProvider,
  StepperIndicator,
  StepNavigation,
  StepPanel,
  StepProgressBar,
  Card,
  Badge,
  AnimatedCurrency,
} from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import {
  CubeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Service {
  id: string;
  name: string;
  price: number | string;
  duration: number | string;
}

interface CreatePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper function to safely convert to number
const toNumber = (value: number | string | undefined | null): number => {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

// Steps definition
const STEPS = [
  { id: 'info', title: 'Informações', description: 'Nome e descrição', icon: <DocumentTextIcon className="w-5 h-5" /> },
  { id: 'services', title: 'Serviços', description: 'Selecione os serviços', icon: <CubeIcon className="w-5 h-5" /> },
  { id: 'pricing', title: 'Preço', description: 'Desconto e valor final', icon: <CurrencyDollarIcon className="w-5 h-5" /> },
  { id: 'review', title: 'Revisão', description: 'Confirme os dados', icon: <CheckCircleIcon className="w-5 h-5" /> },
];

export default function CreatePackageModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePackageModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState<CreatePackageRequest>({
    name: '',
    description: '',
    planType: 'WEEKLY',
    serviceIds: [],
    discountAmount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const response = await fetch('http://localhost:3001/api/services', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      const normalizedServices = data
        .filter((s: Service) => s)
        .map((s: Service) => ({
          ...s,
          price: toNumber(s.price),
          duration: toNumber(s.duration),
        }));
      setServices(normalizedServices);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoadingServices(false);
    }
  };

  // Service options for MultiSelect
  const serviceOptions: SelectOption<string>[] = useMemo(
    () =>
      services.map((s) => ({
        value: s.id,
        label: s.name,
        description: `R$ ${toNumber(s.price).toFixed(2)} | ${toNumber(s.duration)} min`,
      })),
    [services]
  );

  // Calculate derived values
  const selectedServices = useMemo(
    () => services.filter((s) => formData.serviceIds.includes(s.id)),
    [services, formData.serviceIds]
  );

  const basePrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + toNumber(s.price), 0),
    [selectedServices]
  );

  const finalPrice = useMemo(
    () => Math.max(0, basePrice - (formData.discountAmount || 0)),
    [basePrice, formData.discountAmount]
  );

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + toNumber(s.duration), 0),
    [selectedServices]
  );

  // Validation for each step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.name.trim()) {
        newErrors.name = 'Nome é obrigatório';
      }
    }

    if (step === 1) {
      if (formData.serviceIds.length === 0) {
        newErrors.serviceIds = 'Selecione pelo menos um serviço';
      }
    }

    if (step === 2) {
      if (formData.discountAmount && formData.discountAmount > basePrice) {
        newErrors.discountAmount = 'Desconto não pode ser maior que o preço base';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Pacote criado com sucesso!');
        onSuccess();
        handleClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao criar pacote');
      }
    } catch (error) {
      console.error('Erro ao criar pacote:', error);
      toast.error('Erro ao criar pacote');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      planType: 'WEEKLY',
      serviceIds: [],
      discountAmount: 0,
    });
    setErrors({});
    onClose();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const planTypeOptions = [
    { value: 'WEEKLY', label: 'Semanal', description: 'A cada 7 dias' },
    { value: 'BIWEEKLY', label: 'Quinzenal', description: 'A cada 14 dias' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Criar Novo Pacote"
      size="lg"
    >
      <FormStepsProvider steps={STEPS} initialStep={0}>
        <div className="space-y-6">
          {/* Progress */}
          <StepProgressBar showLabel showPercentage />

          {/* Stepper */}
          <StepperIndicator variant="default" clickable />

          {/* Step 1: Basic Info */}
          <StepPanel stepIndex={0}>
            <div className="space-y-4">
              <Input
                label="Nome do Pacote"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Pacote Completo Mensal"
                error={errors.name}
                required
              />

              <Textarea
                label="Descrição"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o pacote..."
                rows={3}
              />

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Frequência <span className="text-red-500">*</span>
                </label>
                <RadioGroup
                  name="planType"
                  value={formData.planType}
                  onChange={(value) =>
                    setFormData({ ...formData, planType: value as SubscriptionPlanType })
                  }
                  options={planTypeOptions}
                  direction="horizontal"
                />
              </div>
            </div>
          </StepPanel>

          {/* Step 2: Services Selection */}
          <StepPanel stepIndex={1}>
            <div className="space-y-4">
              <MultiSelect
                label="Serviços Incluídos"
                value={formData.serviceIds}
                onChange={(ids) => setFormData({ ...formData, serviceIds: ids })}
                options={serviceOptions}
                placeholder={loadingServices ? 'Carregando serviços...' : 'Selecione os serviços'}
                searchPlaceholder="Buscar serviços..."
                error={errors.serviceIds}
                required
                showSelectAll
                disabled={loadingServices}
              />

              {/* Selected services summary */}
              <AnimatePresence>
                {selectedServices.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Card variant="outline" className="bg-dark-800/50">
                      <h4 className="text-sm font-medium text-dark-300 mb-3">
                        Serviços selecionados ({selectedServices.length})
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedServices.map((service) => (
                          <div
                            key={service.id}
                            className="flex justify-between items-center text-sm py-1.5 border-b border-dark-700 last:border-0"
                          >
                            <span className="text-white">{service.name}</span>
                            <div className="flex items-center gap-3 text-dark-400">
                              <span>{toNumber(service.duration)} min</span>
                              <span className="text-primary-400">
                                {formatCurrency(toNumber(service.price))}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-dark-700 flex justify-between text-sm">
                        <span className="text-dark-400">Duração total:</span>
                        <span className="font-medium text-white">{totalDuration} min</span>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </StepPanel>

          {/* Step 3: Pricing */}
          <StepPanel stepIndex={2}>
            <div className="space-y-4">
              {/* Base price display */}
              <Card variant="outline" className="bg-dark-800/50">
                <div className="flex justify-between items-center">
                  <span className="text-dark-400">Preço base dos serviços:</span>
                  <AnimatedCurrency value={basePrice} className="text-lg font-medium text-white" />
                </div>
              </Card>

              {/* Discount input */}
              <CurrencyInput
                label="Desconto"
                value={formData.discountAmount || 0}
                onChange={(value) => setFormData({ ...formData, discountAmount: value })}
                error={errors.discountAmount}
                helperText="Valor a ser descontado do preço base"
              />

              {/* Final price */}
              <Card className="bg-gradient-to-r from-green-900/30 to-green-800/20 border-green-700/50">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-lg font-semibold text-white">Preço Final</span>
                    {formData.discountAmount && formData.discountAmount > 0 && (
                      <p className="text-sm text-green-400 mt-1">
                        Economia de {formatCurrency(formData.discountAmount)} por pacote
                      </p>
                    )}
                  </div>
                  <AnimatedCurrency
                    value={finalPrice}
                    className="text-2xl font-bold text-green-500"
                  />
                </div>
              </Card>
            </div>
          </StepPanel>

          {/* Step 4: Review */}
          <StepPanel stepIndex={3}>
            <div className="space-y-4">
              <Card variant="outline" className="bg-dark-800/50">
                <h4 className="font-semibold text-white mb-4">Resumo do Pacote</h4>

                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-dark-400">Nome:</span>
                    <span className="text-white font-medium text-right max-w-[60%]">
                      {formData.name || '-'}
                    </span>
                  </div>

                  {formData.description && (
                    <div className="flex justify-between items-start">
                      <span className="text-dark-400">Descrição:</span>
                      <span className="text-white text-right max-w-[60%]">
                        {formData.description}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-dark-400">Frequência:</span>
                    <Badge variant="info">
                      {formData.planType === 'WEEKLY' ? 'Semanal' : 'Quinzenal'}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-dark-400">Serviços:</span>
                    <span className="text-white">{selectedServices.length} serviço(s)</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-dark-400">Duração total:</span>
                    <span className="text-white">{totalDuration} min</span>
                  </div>

                  <div className="border-t border-dark-700 pt-3 mt-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-dark-400">Preço base:</span>
                      <span className="text-white">{formatCurrency(basePrice)}</span>
                    </div>
                    {formData.discountAmount && formData.discountAmount > 0 && (
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-dark-400">Desconto:</span>
                        <span className="text-red-400">- {formatCurrency(formData.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-dark-700">
                      <span className="font-semibold text-white">Preço final:</span>
                      <span className="text-xl font-bold text-green-500">
                        {formatCurrency(finalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Services list */}
              <Card variant="outline" className="bg-dark-800/50">
                <h4 className="font-semibold text-white mb-3">Serviços incluídos:</h4>
                <ul className="space-y-2">
                  {selectedServices.map((service) => (
                    <li key={service.id} className="flex items-center gap-2 text-sm">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-white">{service.name}</span>
                      <span className="text-dark-500 ml-auto">
                        {toNumber(service.duration)} min
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </StepPanel>

          {/* Navigation */}
          <StepNavigation
            onNext={() => {}}
            onComplete={handleSubmit}
            isNextDisabled={
              // Disable next based on current step validation
              false
            }
            isCompleteLoading={loading}
            completeLabel="Criar Pacote"
          />
        </div>
      </FormStepsProvider>
    </Modal>
  );
}
