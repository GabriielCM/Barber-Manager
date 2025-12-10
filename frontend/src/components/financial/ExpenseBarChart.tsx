'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface CategoryData {
  income: number;
  expense: number;
}

interface ExpenseBarChartProps {
  data: Record<string, CategoryData>;
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

const COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
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
        <p className="text-red-400 text-sm">
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

export function ExpenseBarChart({
  data,
  isLoading,
  onCategoryClick,
}: ExpenseBarChartProps) {
  const chartData = useMemo(() => {
    if (!data) return [];

    const items = Object.entries(data)
      .filter(([, values]) => values.expense > 0)
      .map(([category, values]) => ({
        category,
        name: CATEGORY_LABELS[category] || category,
        value: values.expense,
      }));

    const total = items.reduce((sum, item) => sum + item.value, 0);

    return items
      .map((item) => ({
        ...item,
        percentage: total > 0 ? (item.value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

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
        <div className="text-dark-500 text-sm">Sem despesas</div>
      </div>
    );
  }

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
          <XAxis
            type="number"
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={(value) => formatCurrency(value)}
            axisLine={{ stroke: '#374151' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={{ stroke: '#374151' }}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            onClick={(data) => onCategoryClick?.(data.category)}
            style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.category}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
