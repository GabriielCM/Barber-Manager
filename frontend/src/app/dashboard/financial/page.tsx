'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import {
  PageTransition,
  FadeIn,
  Button,
  Input,
  Select,
  Badge,
  Card,
  CardTitle,
  Table,
  TableSkeleton,
  DeleteConfirmDialog,
} from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import {
  CashFlowChart,
  CategoryPieChart,
  ExpenseBarChart,
  FinancialKPICards,
  GoalConfigModal,
  ExportButtons,
} from '@/components/financial';
import { useFinancialData } from '@/hooks/useFinancialData';
import { FinancialTransaction } from '@/types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

const CATEGORIES: Record<string, string> = {
  SERVICE: 'Serviço',
  PRODUCT: 'Produto',
  PACKAGE: 'Pacote',
  SUPPLIES: 'Insumos',
  RENT: 'Aluguel',
  UTILITIES: 'Utilidades',
  SALARY: 'Salário',
  MAINTENANCE: 'Manutenção',
  MARKETING: 'Marketing',
  OTHER: 'Outro',
};

const typeOptions = [
  { value: 'INCOME', label: 'Entrada' },
  { value: 'EXPENSE', label: 'Saída' },
];

const categoryOptions = Object.entries(CATEGORIES).map(([value, label]) => ({
  value,
  label,
}));

export default function FinancialPage() {
  // Date state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [year, month] = selectedMonth.split('-').map(Number);

  // Data hook
  const {
    transactions,
    cashFlow,
    kpis,
    isLoading,
    createTransaction,
    deleteTransaction,
  } = useFinancialData({ year, month });

  // Modal states
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    transaction: FinancialTransaction | null;
  }>({ isOpen: false, transaction: null });

  // Goal state (temporary - will come from backend)
  const [goal, setGoal] = useState<{
    type: 'REVENUE' | 'PROFIT' | 'CLIENTS';
    targetValue: number;
    month: number;
    year: number;
  } | null>(null);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Computed values
  const monthName = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: ptBR });

  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  // Calculate goal progress
  const goalProgress = useMemo(() => {
    if (!goal || !kpis) return undefined;

    let currentValue = 0;
    if (goal.type === 'REVENUE') currentValue = kpis.revenue;
    else if (goal.type === 'PROFIT') currentValue = kpis.profit;
    else if (goal.type === 'CLIENTS') currentValue = kpis.checkoutCount;

    return goal.targetValue > 0 ? (currentValue / goal.targetValue) * 100 : 0;
  }, [goal, kpis]);

  // Handlers
  const openTransactionModal = () => {
    reset({
      type: 'EXPENSE',
      category: 'OTHER',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setIsTransactionModalOpen(false);
    reset();
  };

  const onSubmitTransaction = async (data: any) => {
    const success = await createTransaction(data);
    if (success) {
      closeTransactionModal();
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.transaction) return;
    const success = await deleteTransaction(deleteDialog.transaction.id);
    if (success) {
      setDeleteDialog({ isOpen: false, transaction: null });
    }
  };

  const handleGoalSubmit = async (data: any) => {
    // TODO: Save to backend when endpoint is ready
    setGoal(data);
    toast.success('Meta definida com sucesso!');
    return true;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Table columns
  const columns = [
    {
      key: 'date',
      header: 'Data',
      render: (t: FinancialTransaction) => format(new Date(t.date), 'dd/MM/yyyy'),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (t: FinancialTransaction) => (
        <Badge variant={t.type === 'INCOME' ? 'success' : 'danger'} size="sm">
          {t.type === 'INCOME' ? 'Entrada' : 'Saída'}
        </Badge>
      ),
    },
    {
      key: 'category',
      header: 'Categoria',
      render: (t: FinancialTransaction) => CATEGORIES[t.category] || t.category,
    },
    {
      key: 'description',
      header: 'Descrição',
      render: (t: FinancialTransaction) => (
        <span className="max-w-xs truncate block">{t.description}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Valor',
      render: (t: FinancialTransaction) => (
        <span className={t.type === 'INCOME' ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
          {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (t: FinancialTransaction) =>
        !t.checkoutId && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDeleteDialog({ isOpen: true, transaction: t })}
            className="p-2 text-dark-400 hover:text-red-500 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
          </motion.button>
        ),
    },
  ];

  return (
    <PageTransition>
      <Header title="Financeiro" subtitle={`Fluxo de caixa - ${monthName}`} />

      <div className="p-8 space-y-6">
        {/* Header Actions */}
        <FadeIn>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-48"
              />
              <ExportButtons startDate={startDate} endDate={endDate} disabled={isLoading} />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => setIsGoalModalOpen(true)}
                leftIcon={<ChartBarIcon className="w-5 h-5" />}
              >
                {goal ? 'Editar Meta' : 'Definir Meta'}
              </Button>
              <Button
                onClick={openTransactionModal}
                leftIcon={<PlusIcon className="w-5 h-5" />}
              >
                Nova Transação
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* KPI Cards */}
        <FadeIn delay={0.1}>
          <FinancialKPICards
            data={kpis}
            isLoading={isLoading}
            goalProgress={goalProgress}
            onGoalClick={() => setIsGoalModalOpen(true)}
          />
        </FadeIn>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cash Flow Chart */}
          <FadeIn delay={0.2}>
            <Card className="lg:col-span-2">
              <CardTitle className="mb-4">Fluxo de Caixa do Mês</CardTitle>
              <CashFlowChart data={cashFlow?.byDay || {}} isLoading={isLoading} />
            </Card>
          </FadeIn>

          {/* Revenue by Category (Pie) */}
          <FadeIn delay={0.3}>
            <Card>
              <CardTitle className="mb-4">Receitas por Categoria</CardTitle>
              <CategoryPieChart
                data={cashFlow?.byCategory || {}}
                type="income"
                isLoading={isLoading}
              />
            </Card>
          </FadeIn>

          {/* Expenses by Category (Bar) */}
          <FadeIn delay={0.35}>
            <Card>
              <CardTitle className="mb-4">Despesas por Categoria</CardTitle>
              <ExpenseBarChart
                data={cashFlow?.byCategory || {}}
                isLoading={isLoading}
              />
            </Card>
          </FadeIn>
        </div>

        {/* Transactions Table */}
        <FadeIn delay={0.4}>
          <Card>
            <CardTitle className="mb-4">Últimas Transações</CardTitle>
            {isLoading ? (
              <TableSkeleton rows={6} columns={6} />
            ) : transactions.length === 0 ? (
              <p className="text-dark-400 py-8 text-center">
                Nenhuma transação neste período
              </p>
            ) : (
              <Table
                data={transactions.slice(0, 10)}
                columns={columns}
                keyExtractor={(t) => t.id}
              />
            )}
            {transactions.length > 10 && (
              <div className="mt-4 text-center">
                <span className="text-dark-400 text-sm">
                  Mostrando 10 de {transactions.length} transações
                </span>
              </div>
            )}
          </Card>
        </FadeIn>
      </div>

      {/* New Transaction Modal */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={closeTransactionModal}
        title="Nova Transação"
      >
        <form onSubmit={handleSubmit(onSubmitTransaction)} className="space-y-4">
          <Select
            label="Tipo"
            required
            options={typeOptions}
            {...register('type', { required: true })}
          />

          <Select
            label="Categoria"
            required
            options={categoryOptions}
            {...register('category', { required: true })}
          />

          <Input
            label="Descrição"
            required
            error={errors.description?.message as string}
            {...register('description', { required: 'Obrigatório' })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valor (R$)"
              type="number"
              step="0.01"
              min="0.01"
              required
              error={errors.amount?.message as string}
              {...register('amount', { required: 'Obrigatório' })}
            />
            <Input
              label="Data"
              type="date"
              required
              error={errors.date?.message as string}
              {...register('date', { required: 'Obrigatório' })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <Button type="button" variant="secondary" onClick={closeTransactionModal}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Goal Config Modal */}
      <GoalConfigModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSubmit={handleGoalSubmit}
        currentGoal={goal}
        selectedMonth={month}
        selectedYear={year}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, transaction: null })}
        onConfirm={handleDelete}
        title="Excluir Transação"
        itemName={deleteDialog.transaction?.description || ''}
      />
    </PageTransition>
  );
}
