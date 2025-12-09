'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  Button,
  Input,
  Select,
  Badge,
  Card,
  CardTitle,
  StatCard,
  Table,
  TableSkeleton,
  StatCardSkeleton,
  DeleteConfirmDialog,
  AnimatedCurrency,
} from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { financialApi } from '@/lib/api';
import { FinancialTransaction } from '@/types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

const CATEGORIES = {
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
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; transaction: FinancialTransaction | null }>({
    isOpen: false,
    transaction: null,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const fetchData = async () => {
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();

      const [transactionsRes, cashFlowRes] = await Promise.all([
        financialApi.getTransactions({ startDate, endDate }),
        financialApi.getMonthlyCashFlow(year, month),
      ]);

      setTransactions(transactionsRes.data.transactions);
      setCashFlow(cashFlowRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedMonth]);

  const openModal = () => {
    reset({
      type: 'EXPENSE',
      category: 'OTHER',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); reset(); };

  const onSubmit = async (data: any) => {
    try {
      await financialApi.createTransaction({
        ...data,
        amount: Number(data.amount),
      });
      toast.success('Transação registrada!');
      closeModal();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao registrar');
    }
  };

  const openDeleteDialog = (transaction: FinancialTransaction) => {
    setDeleteDialog({ isOpen: true, transaction });
  };

  const handleDelete = async () => {
    if (!deleteDialog.transaction) return;
    try {
      await financialApi.deleteTransaction(deleteDialog.transaction.id);
      toast.success('Transação excluída!');
      fetchData();
      setDeleteDialog({ isOpen: false, transaction: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const [year, month] = selectedMonth.split('-').map(Number);
  const monthName = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: ptBR });

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
      render: (t: FinancialTransaction) => CATEGORIES[t.category as keyof typeof CATEGORIES],
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
      render: (t: FinancialTransaction) => (
        !t.checkoutId && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openDeleteDialog(t)}
            className="p-2 text-dark-400 hover:text-red-500 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
          </motion.button>
        )
      ),
    },
  ];

  return (
    <PageTransition>
      <Header title="Financeiro" subtitle={`Fluxo de caixa - ${monthName}`} />

      <div className="p-8">
        {/* Month Selector & Actions */}
        <FadeIn>
          <div className="flex items-center justify-between mb-6">
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-48"
            />
            <Button
              onClick={openModal}
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              Nova Transação
            </Button>
          </div>
        </FadeIn>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : cashFlow && (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StaggerItem>
              <StatCard
                title="Entradas"
                value={
                  <AnimatedCurrency
                    value={cashFlow.income}
                    className="text-green-500"
                  />
                }
                icon={<ArrowTrendingUpIcon className="w-6 h-6" />}
                iconColor="text-green-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Saídas"
                value={
                  <AnimatedCurrency
                    value={cashFlow.expense}
                    className="text-red-500"
                  />
                }
                icon={<ArrowTrendingDownIcon className="w-6 h-6" />}
                iconColor="text-red-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Saldo"
                value={
                  <AnimatedCurrency
                    value={cashFlow.balance}
                    className={cashFlow.balance >= 0 ? 'text-green-500' : 'text-red-500'}
                  />
                }
                icon={<CurrencyDollarIcon className="w-6 h-6" />}
                iconColor="text-primary-500"
              />
            </StaggerItem>
          </StaggerContainer>
        )}

        {/* By Category */}
        {cashFlow && Object.keys(cashFlow.byCategory).length > 0 && (
          <FadeIn delay={0.2}>
            <Card className="mb-8">
              <CardTitle className="mb-4">Por Categoria</CardTitle>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(cashFlow.byCategory).map(([category, data]: [string, any], index) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-dark-800 p-4 rounded-lg border border-dark-700 hover:border-primary-500/30 transition-colors"
                  >
                    <p className="text-dark-400 text-sm mb-2">{CATEGORIES[category as keyof typeof CATEGORIES]}</p>
                    {data.income > 0 && (
                      <p className="text-green-500 font-medium">+{formatCurrency(data.income)}</p>
                    )}
                    {data.expense > 0 && (
                      <p className="text-red-500 font-medium">-{formatCurrency(data.expense)}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </Card>
          </FadeIn>
        )}

        {/* Transactions Table */}
        <FadeIn delay={0.3}>
          <Card>
            <CardTitle className="mb-4">Transações</CardTitle>
            {isLoading ? (
              <TableSkeleton rows={6} columns={6} />
            ) : transactions.length === 0 ? (
              <p className="text-dark-400 py-8 text-center">Nenhuma transação neste período</p>
            ) : (
              <Table
                data={transactions}
                columns={columns}
                keyExtractor={(t) => t.id}
              />
            )}
          </Card>
        </FadeIn>
      </div>

      {/* New Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Nova Transação">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

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
