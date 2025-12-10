import { useState, useEffect, useCallback, useMemo } from 'react';
import { financialApi } from '@/lib/api';
import { FinancialTransaction } from '@/types';
import toast from 'react-hot-toast';

interface DashboardStats {
  today: {
    revenue: number;
    checkouts: number;
    appointments: number;
    completedAppointments: number;
  };
  month: {
    revenue: number;
    expenses: number;
    profit: number;
    checkouts: number;
  };
  alerts: {
    lowStockCount: number;
  };
  totals: {
    activeClients: number;
  };
}

interface MonthlyCashFlow {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
  byCategory: Record<string, { income: number; expense: number }>;
  byDay: Record<string, { income: number; expense: number }>;
}

interface UseFinancialDataParams {
  year: number;
  month: number;
}

interface UseFinancialDataReturn {
  // Data
  transactions: FinancialTransaction[];
  cashFlow: MonthlyCashFlow | null;
  dashboardStats: DashboardStats | null;
  previousMonthCashFlow: MonthlyCashFlow | null;

  // Loading states
  isLoading: boolean;
  isLoadingDashboard: boolean;

  // Computed values
  kpis: {
    revenue: number;
    revenueChange: number;
    expenses: number;
    expensesChange: number;
    profit: number;
    profitChange: number;
    avgTicket: number;
    checkoutCount: number;
  } | null;

  // Actions
  refetch: () => Promise<void>;
  createTransaction: (data: any) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
}

export function useFinancialData({ year, month }: UseFinancialDataParams): UseFinancialDataReturn {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [cashFlow, setCashFlow] = useState<MonthlyCashFlow | null>(null);
  const [previousMonthCashFlow, setPreviousMonthCashFlow] = useState<MonthlyCashFlow | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  // Calculate previous month
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();

      const [transactionsRes, cashFlowRes, prevCashFlowRes] = await Promise.all([
        financialApi.getTransactions({ startDate, endDate, take: 100 }),
        financialApi.getMonthlyCashFlow(year, month),
        financialApi.getMonthlyCashFlow(prevYear, prevMonth),
      ]);

      setTransactions(transactionsRes.data.transactions);
      setCashFlow(cashFlowRes.data);
      setPreviousMonthCashFlow(prevCashFlowRes.data);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setIsLoading(false);
    }
  }, [year, month, prevYear, prevMonth]);

  const fetchDashboard = useCallback(async () => {
    setIsLoadingDashboard(true);
    try {
      const res = await financialApi.getDashboard();
      setDashboardStats(res.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchDashboard();
  }, [fetchData, fetchDashboard]);

  // Calculate KPIs with comparison to previous month
  const kpis = useMemo(() => {
    if (!cashFlow) return null;

    const revenue = cashFlow.income || 0;
    const expenses = cashFlow.expense || 0;
    const profit = revenue - expenses;

    const prevRevenue = previousMonthCashFlow?.income || 0;
    const prevExpenses = previousMonthCashFlow?.expense || 0;
    const prevProfit = prevRevenue - prevExpenses;

    // Calculate percentage changes
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Count checkouts from dashboard stats
    const checkoutCount = dashboardStats?.month.checkouts || 0;
    const avgTicket = checkoutCount > 0 ? revenue / checkoutCount : 0;

    return {
      revenue,
      revenueChange: calcChange(revenue, prevRevenue),
      expenses,
      expensesChange: calcChange(expenses, prevExpenses),
      profit,
      profitChange: calcChange(profit, prevProfit),
      avgTicket,
      checkoutCount,
    };
  }, [cashFlow, previousMonthCashFlow, dashboardStats]);

  const createTransaction = useCallback(async (data: any): Promise<boolean> => {
    try {
      await financialApi.createTransaction({
        ...data,
        amount: Number(data.amount),
      });
      toast.success('Transação registrada!');
      await fetchData();
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao registrar transação');
      return false;
    }
  }, [fetchData]);

  const deleteTransaction = useCallback(async (id: string): Promise<boolean> => {
    try {
      await financialApi.deleteTransaction(id);
      toast.success('Transação excluída!');
      await fetchData();
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir transação');
      return false;
    }
  }, [fetchData]);

  return {
    transactions,
    cashFlow,
    dashboardStats,
    previousMonthCashFlow,
    isLoading,
    isLoadingDashboard,
    kpis,
    refetch: fetchData,
    createTransaction,
    deleteTransaction,
  };
}
