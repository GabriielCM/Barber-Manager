'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PageLoading } from '@/components/ui/LoadingSpinner';
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

export default function FinancialPage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir transação?')) return;
    try {
      await financialApi.deleteTransaction(id);
      toast.success('Transação excluída!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir');
    }
  };

  if (isLoading) return <PageLoading />;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const [year, month] = selectedMonth.split('-').map(Number);
  const monthName = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: ptBR });

  return (
    <>
      <Header title="Financeiro" subtitle={`Fluxo de caixa - ${monthName}`} />

      <div className="p-8">
        {/* Month Selector & Actions */}
        <div className="flex items-center justify-between mb-6">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input w-48"
          />
          <button onClick={openModal} className="btn btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Nova Transação
          </button>
        </div>

        {/* Summary Cards */}
        {cashFlow && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                <span className="stat-card-title">Entradas</span>
              </div>
              <span className="stat-card-value text-green-500">
                {formatCurrency(cashFlow.income)}
              </span>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
                <span className="stat-card-title">Saídas</span>
              </div>
              <span className="stat-card-value text-red-500">
                {formatCurrency(cashFlow.expense)}
              </span>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="w-5 h-5 text-primary-500" />
                <span className="stat-card-title">Saldo</span>
              </div>
              <span className={`stat-card-value ${cashFlow.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(cashFlow.balance)}
              </span>
            </div>
          </div>
        )}

        {/* By Category */}
        {cashFlow && Object.keys(cashFlow.byCategory).length > 0 && (
          <div className="card mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Por Categoria</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(cashFlow.byCategory).map(([category, data]: [string, any]) => (
                <div key={category} className="bg-dark-800 p-4 rounded-lg">
                  <p className="text-dark-400 text-sm">{CATEGORIES[category as keyof typeof CATEGORIES]}</p>
                  {data.income > 0 && (
                    <p className="text-green-500">+{formatCurrency(data.income)}</p>
                  )}
                  {data.expense > 0 && (
                    <p className="text-red-500">-{formatCurrency(data.expense)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Transações</h3>
          {transactions.length === 0 ? (
            <p className="text-dark-400">Nenhuma transação neste período</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{format(new Date(t.date), 'dd/MM/yyyy')}</td>
                      <td>
                        <span className={`badge ${t.type === 'INCOME' ? 'badge-success' : 'badge-danger'}`}>
                          {t.type === 'INCOME' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td>{CATEGORIES[t.category as keyof typeof CATEGORIES]}</td>
                      <td className="max-w-xs truncate">{t.description}</td>
                      <td className={t.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}>
                        {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                      <td>
                        {!t.checkoutId && (
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-2 text-dark-400 hover:text-red-500"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Nova Transação">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Tipo *</label>
            <select className="input" {...register('type', { required: true })}>
              <option value="INCOME">Entrada</option>
              <option value="EXPENSE">Saída</option>
            </select>
          </div>

          <div>
            <label className="label">Categoria *</label>
            <select className="input" {...register('category', { required: true })}>
              {Object.entries(CATEGORIES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Descrição *</label>
            <input className="input" {...register('description', { required: 'Obrigatório' })} />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message as string}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Valor (R$) *</label>
              <input type="number" step="0.01" min="0.01" className="input" {...register('amount', { required: 'Obrigatório' })} />
            </div>
            <div>
              <label className="label">Data *</label>
              <input type="date" className="input" {...register('date', { required: 'Obrigatório' })} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={closeModal} className="btn btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
