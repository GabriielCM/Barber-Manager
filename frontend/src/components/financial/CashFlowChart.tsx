'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DayData {
  date: string;
  income: number;
  expense: number;
}

interface CashFlowChartProps {
  data: Record<string, { income: number; expense: number }>;
  isLoading?: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
    const expense = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
    const balance = income - expense;

    return (
      <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl">
        <p className="text-white font-medium mb-2">
          {format(parseISO(label), "dd 'de' MMMM", { locale: ptBR })}
        </p>
        <div className="space-y-1 text-sm">
          <p className="text-green-400">
            Receitas: {formatCurrency(income)}
          </p>
          <p className="text-red-400">
            Despesas: {formatCurrency(expense)}
          </p>
          <div className="border-t border-dark-600 pt-1 mt-1">
            <p className={balance >= 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
              Saldo: {formatCurrency(balance)}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function CashFlowChart({ data, isLoading }: CashFlowChartProps) {
  const chartData = useMemo(() => {
    if (!data) return [];

    return Object.entries(data)
      .map(([date, values]) => ({
        date,
        income: values.income || 0,
        expense: values.expense || 0,
        balance: (values.income || 0) - (values.expense || 0),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-[300px] bg-dark-800 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-dark-500">Carregando gráfico...</div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="h-[300px] bg-dark-800 rounded-lg flex items-center justify-center">
        <div className="text-dark-500">Sem dados para exibir</div>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickFormatter={(value) => format(parseISO(value), 'dd/MM')}
            axisLine={{ stroke: '#374151' }}
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value)}
            axisLine={{ stroke: '#374151' }}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => (
              <span className="text-gray-300">
                {value === 'income' ? 'Receitas' : value === 'expense' ? 'Despesas' : 'Saldo'}
              </span>
            )}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#22c55e"
            fill="url(#incomeGradient)"
            strokeWidth={0}
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="#ef4444"
            fill="url(#expenseGradient)"
            strokeWidth={0}
          />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 6, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="expense"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
