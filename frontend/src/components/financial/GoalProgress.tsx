'use client';

import { motion } from 'framer-motion';
import { AnimatedCurrency } from '@/components/ui/AnimatedNumber';
import { ChartBarIcon, PencilIcon } from '@heroicons/react/24/outline';

interface GoalProgressProps {
  currentValue: number;
  targetValue: number;
  type: 'REVENUE' | 'PROFIT' | 'CLIENTS';
  onEdit?: () => void;
  isLoading?: boolean;
}

const TYPE_LABELS = {
  REVENUE: 'Receita',
  PROFIT: 'Lucro',
  CLIENTS: 'Clientes',
};

export function GoalProgress({
  currentValue,
  targetValue,
  type,
  onEdit,
  isLoading,
}: GoalProgressProps) {
  const progress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
  const progressCapped = Math.min(progress, 100);

  const getStatusColor = () => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-primary-500';
    if (progress >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (progress >= 100) return 'Meta atingida!';
    if (progress >= 75) return 'Quase lá!';
    if (progress >= 50) return 'Na metade';
    return 'Continue trabalhando';
  };

  if (isLoading) {
    return (
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 animate-pulse">
        <div className="h-6 w-32 bg-dark-700 rounded mb-4" />
        <div className="h-4 w-full bg-dark-700 rounded mb-2" />
        <div className="h-8 w-24 bg-dark-700 rounded" />
      </div>
    );
  }

  if (targetValue === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800 border border-dark-700 rounded-xl p-6 text-center cursor-pointer hover:border-primary-500/50 transition-colors"
        onClick={onEdit}
      >
        <ChartBarIcon className="w-12 h-12 text-dark-500 mx-auto mb-3" />
        <p className="text-dark-400 mb-2">Nenhuma meta definida</p>
        <p className="text-primary-500 text-sm font-medium">
          Clique para definir uma meta
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-800 border border-dark-700 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Meta de {TYPE_LABELS[type]}
        </h3>
        {onEdit && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            className="p-2 text-dark-400 hover:text-primary-500 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <PencilIcon className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-dark-400">Progresso</span>
          <span className={`font-medium ${progress >= 100 ? 'text-green-500' : 'text-white'}`}>
            {progress.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressCapped}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-3 rounded-full ${getStatusColor()}`}
          />
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-dark-400 text-xs mb-1">Atual</p>
          {type === 'CLIENTS' ? (
            <p className="text-xl font-bold text-white">{currentValue}</p>
          ) : (
            <AnimatedCurrency
              value={currentValue}
              className="text-xl font-bold text-white"
            />
          )}
        </div>
        <div>
          <p className="text-dark-400 text-xs mb-1">Meta</p>
          {type === 'CLIENTS' ? (
            <p className="text-xl font-bold text-primary-500">{targetValue}</p>
          ) : (
            <AnimatedCurrency
              value={targetValue}
              className="text-xl font-bold text-primary-500"
            />
          )}
        </div>
      </div>

      {/* Status */}
      <div className={`text-center py-2 rounded-lg ${
        progress >= 100 ? 'bg-green-500/10 text-green-500' :
        progress >= 75 ? 'bg-primary-500/10 text-primary-500' :
        progress >= 50 ? 'bg-amber-500/10 text-amber-500' :
        'bg-red-500/10 text-red-500'
      }`}>
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>

      {/* Remaining */}
      {progress < 100 && (
        <p className="text-dark-400 text-xs text-center mt-3">
          Faltam{' '}
          {type === 'CLIENTS' ? (
            <span className="text-white font-medium">{Math.ceil(targetValue - currentValue)} clientes</span>
          ) : (
            <span className="text-white font-medium">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(targetValue - currentValue)}
            </span>
          )}
        </p>
      )}
    </motion.div>
  );
}
