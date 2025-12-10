'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { Button, Input, Select } from '@/components/ui';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

interface GoalFormData {
  type: 'REVENUE' | 'PROFIT' | 'CLIENTS';
  targetValue: number;
  month: number;
  year: number;
}

interface GoalConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormData) => Promise<boolean>;
  currentGoal?: {
    type: 'REVENUE' | 'PROFIT' | 'CLIENTS';
    targetValue: number;
    month: number;
    year: number;
  } | null;
  selectedMonth: number;
  selectedYear: number;
}

const GOAL_TYPES = [
  { value: 'REVENUE', label: 'Meta de Receita' },
  { value: 'PROFIT', label: 'Meta de Lucro' },
  { value: 'CLIENTS', label: 'Meta de Clientes' },
];

const MONTHS = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export function GoalConfigModal({
  isOpen,
  onClose,
  onSubmit,
  currentGoal,
  selectedMonth,
  selectedYear,
}: GoalConfigModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormData>({
    defaultValues: {
      type: 'REVENUE',
      targetValue: 0,
      month: selectedMonth,
      year: selectedYear,
    },
  });

  const goalType = watch('type');

  useEffect(() => {
    if (isOpen) {
      if (currentGoal) {
        reset({
          type: currentGoal.type,
          targetValue: currentGoal.targetValue,
          month: currentGoal.month,
          year: currentGoal.year,
        });
      } else {
        reset({
          type: 'REVENUE',
          targetValue: 0,
          month: selectedMonth,
          year: selectedYear,
        });
      }
    }
  }, [isOpen, currentGoal, selectedMonth, selectedYear, reset]);

  const handleFormSubmit = async (data: GoalFormData) => {
    const success = await onSubmit({
      ...data,
      targetValue: Number(data.targetValue),
      month: Number(data.month),
      year: Number(data.year),
    });
    if (success) {
      onClose();
    }
  };

  // Generate year options (current year -1 to +1)
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: String(currentYear - 1), label: String(currentYear - 1) },
    { value: String(currentYear), label: String(currentYear) },
    { value: String(currentYear + 1), label: String(currentYear + 1) },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentGoal ? 'Editar Meta' : 'Definir Meta'}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Select
          label="Tipo de Meta"
          required
          options={GOAL_TYPES}
          {...register('type', { required: 'Selecione o tipo' })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Mês"
            required
            options={MONTHS}
            {...register('month', { required: 'Selecione o mês' })}
          />
          <Select
            label="Ano"
            required
            options={yearOptions}
            {...register('year', { required: 'Selecione o ano' })}
          />
        </div>

        {goalType === 'CLIENTS' ? (
          <Input
            label="Meta de Clientes"
            type="number"
            min="1"
            required
            placeholder="Ex: 150"
            error={errors.targetValue?.message}
            {...register('targetValue', {
              required: 'Informe a meta',
              min: { value: 1, message: 'Valor mínimo é 1' },
            })}
          />
        ) : (
          <CurrencyInput
            label={goalType === 'REVENUE' ? 'Meta de Receita (R$)' : 'Meta de Lucro (R$)'}
            required
            error={errors.targetValue?.message}
            value={watch('targetValue')}
            onChange={(value) => setValue('targetValue', value)}
          />
        )}

        <div className="bg-dark-700/50 rounded-lg p-4 text-sm text-dark-300">
          <p className="font-medium text-white mb-1">Dica:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Meta de Receita:</strong> Total de entradas que você deseja alcançar
            </li>
            <li>
              <strong>Meta de Lucro:</strong> Receita menos despesas
            </li>
            <li>
              <strong>Meta de Clientes:</strong> Número de atendimentos no mês
            </li>
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {currentGoal ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
