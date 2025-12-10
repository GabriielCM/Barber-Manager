'use client';

import { motion } from 'framer-motion';
import { AnimatedCurrency, AnimatedNumber } from '@/components/ui/AnimatedNumber';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  ChartBarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface KPIData {
  revenue: number;
  revenueChange: number;
  expenses: number;
  expensesChange: number;
  profit: number;
  profitChange: number;
  avgTicket: number;
  checkoutCount: number;
}

interface FinancialKPICardsProps {
  data: KPIData | null;
  isLoading?: boolean;
  goalProgress?: number; // 0-100
  onGoalClick?: () => void;
}

const TrendIndicator = ({ value, inverted = false }: { value: number; inverted?: boolean }) => {
  const isPositive = inverted ? value < 0 : value > 0;
  const color = isPositive ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-gray-500';
  const Icon = value >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;

  if (value === 0) return null;

  return (
    <div className={`flex items-center gap-0.5 text-xs ${color}`}>
      <Icon className="w-3 h-3" />
      <span>{Math.abs(value).toFixed(1)}%</span>
    </div>
  );
};

const KPICard = ({
  title,
  value,
  icon: Icon,
  iconColor,
  trend,
  trendInverted,
  isLoading,
  delay = 0,
  onClick,
  extra,
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ElementType;
  iconColor: string;
  trend?: number;
  trendInverted?: boolean;
  isLoading?: boolean;
  delay?: number;
  onClick?: () => void;
  extra?: React.ReactNode;
}) => {
  if (isLoading) {
    return (
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-20 bg-dark-700 rounded" />
          <div className="h-8 w-8 bg-dark-700 rounded-lg" />
        </div>
        <div className="h-7 w-24 bg-dark-700 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`bg-dark-800 border border-dark-700 rounded-xl p-4 hover:border-primary-500/30 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-dark-400 text-sm font-medium">{title}</span>
        <div className={`p-2 rounded-lg bg-dark-700/50 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-xl font-bold text-white">{value}</div>
        {trend !== undefined && <TrendIndicator value={trend} inverted={trendInverted} />}
      </div>
      {extra && <div className="mt-2">{extra}</div>}
    </motion.div>
  );
};

export function FinancialKPICards({
  data,
  isLoading,
  goalProgress,
  onGoalClick,
}: FinancialKPICardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <KPICard
        title="Receita"
        value={
          <AnimatedCurrency
            value={data?.revenue || 0}
            className="text-green-500"
          />
        }
        icon={ArrowTrendingUpIcon}
        iconColor="text-green-500"
        trend={data?.revenueChange}
        isLoading={isLoading}
        delay={0}
      />

      <KPICard
        title="Despesas"
        value={
          <AnimatedCurrency
            value={data?.expenses || 0}
            className="text-red-500"
          />
        }
        icon={ArrowTrendingDownIcon}
        iconColor="text-red-500"
        trend={data?.expensesChange}
        trendInverted
        isLoading={isLoading}
        delay={0.05}
      />

      <KPICard
        title="Lucro"
        value={
          <AnimatedCurrency
            value={data?.profit || 0}
            className={data?.profit && data.profit >= 0 ? 'text-green-500' : 'text-red-500'}
          />
        }
        icon={BanknotesIcon}
        iconColor="text-primary-500"
        trend={data?.profitChange}
        isLoading={isLoading}
        delay={0.1}
      />

      <KPICard
        title="Ticket Médio"
        value={
          <AnimatedCurrency
            value={data?.avgTicket || 0}
            className="text-white"
          />
        }
        icon={CurrencyDollarIcon}
        iconColor="text-amber-500"
        isLoading={isLoading}
        delay={0.15}
      />

      <KPICard
        title="Atendimentos"
        value={
          <AnimatedNumber
            value={data?.checkoutCount || 0}
            className="text-white"
          />
        }
        icon={UserGroupIcon}
        iconColor="text-cyan-500"
        isLoading={isLoading}
        delay={0.2}
      />

      <KPICard
        title="Meta Mensal"
        value={
          goalProgress !== undefined ? (
            <span className="text-white">{goalProgress.toFixed(0)}%</span>
          ) : (
            <span className="text-dark-500 text-sm">Definir</span>
          )
        }
        icon={ChartBarIcon}
        iconColor="text-purple-500"
        isLoading={isLoading}
        delay={0.25}
        onClick={onGoalClick}
        extra={
          goalProgress !== undefined && (
            <div className="w-full bg-dark-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(goalProgress, 100)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`h-2 rounded-full ${
                  goalProgress >= 100
                    ? 'bg-green-500'
                    : goalProgress >= 75
                    ? 'bg-primary-500'
                    : goalProgress >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
              />
            </div>
          )
        }
      />
    </div>
  );
}
