'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface CategoryData {
  income: number;
  expense: number;
}

interface CategoryPieChartProps {
  data: Record<string, CategoryData>;
  type: 'income' | 'expense';
  isLoading?: boolean;
  onCategoryClick?: (category: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  SERVICE: 'Serviços',
  PRODUCT: 'Produtos',
  PACKAGE: 'Pacotes',
  SUPPLIES: 'Insumos',
  RENT: 'Aluguel',
  UTILITIES: 'Utilidades',
  SALARY: 'Salários',
  MAINTENANCE: 'Manutenção',
  MARKETING: 'Marketing',
  OTHER: 'Outros',
};

const INCOME_COLORS = [
  '#22c55e', // green-500
  '#10b981', // emerald-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
];

const EXPENSE_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
  '#a855f7', // purple-500
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl">
        <p className="text-white font-medium">{data.name}</p>
        <p className="text-gray-300 text-sm">
          {formatCurrency(data.value)}
        </p>
        <p className="text-gray-400 text-xs">
          {data.percentage.toFixed(1)}% do total
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-2">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1.5 text-xs">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-400">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function CategoryPieChart({
  data,
  type,
  isLoading,
  onCategoryClick,
}: CategoryPieChartProps) {
  const chartData = useMemo(() => {
    if (!data) return [];

    const items = Object.entries(data)
      .filter(([, values]) => values[type] > 0)
      .map(([category, values]) => ({
        category,
        name: CATEGORY_LABELS[category] || category,
        value: values[type],
      }));

    const total = items.reduce((sum, item) => sum + item.value, 0);

    return items
      .map((item) => ({
        ...item,
        percentage: total > 0 ? (item.value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data, type]);

  const colors = type === 'income' ? INCOME_COLORS : EXPENSE_COLORS;
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <div className="h-[250px] bg-dark-800 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-dark-500">Carregando...</div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="h-[250px] bg-dark-800/50 rounded-lg flex flex-col items-center justify-center">
        <div className="text-dark-500 text-sm">
          Sem {type === 'income' ? 'receitas' : 'despesas'}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            onClick={(data) => onCategoryClick?.(data.category)}
            style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.category}
                fill={colors[index % colors.length]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center -mt-2">
        <span className={`text-lg font-bold ${type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
