'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Select, Badge } from '@/components/ui';
import { MultiSelect } from '@/components/ui/MultiSelect';
import {
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface FilterValues {
  search: string;
  type: string;
  categories: string[];
  startDate: string;
  endDate: string;
}

interface FinancialFiltersProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  onClear: () => void;
}

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os Tipos' },
  { value: 'INCOME', label: 'Entradas' },
  { value: 'EXPENSE', label: 'Saídas' },
];

const CATEGORY_OPTIONS = [
  { value: 'SERVICE', label: 'Serviços' },
  { value: 'PRODUCT', label: 'Produtos' },
  { value: 'PACKAGE', label: 'Pacotes' },
  { value: 'SUPPLIES', label: 'Insumos' },
  { value: 'RENT', label: 'Aluguel' },
  { value: 'UTILITIES', label: 'Utilidades' },
  { value: 'SALARY', label: 'Salários' },
  { value: 'MAINTENANCE', label: 'Manutenção' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'OTHER', label: 'Outros' },
];

const PERIOD_PRESETS = [
  { label: 'Hoje', days: 0 },
  { label: '7 dias', days: 7 },
  { label: '15 dias', days: 15 },
  { label: '30 dias', days: 30 },
];

export function FinancialFilters({
  filters,
  onChange,
  onClear,
}: FinancialFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    filters.search ||
    filters.type ||
    filters.categories.length > 0 ||
    filters.startDate ||
    filters.endDate;

  const activeFilterCount = [
    filters.search,
    filters.type,
    filters.categories.length > 0,
    filters.startDate || filters.endDate,
  ].filter(Boolean).length;

  const handlePeriodPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    onChange({
      ...filters,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  };

  const handleClearAll = () => {
    onClear();
    setIsExpanded(false);
  };

  return (
    <div className="space-y-3">
      {/* Main Filter Bar */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Buscar descrição..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        {/* Type Filter */}
        <Select
          value={filters.type}
          onChange={(e) => onChange({ ...filters, type: e.target.value })}
          options={TYPE_OPTIONS}
          className="w-40"
        />

        {/* Toggle Advanced Filters */}
        <Button
          variant={isExpanded ? 'primary' : 'secondary'}
          onClick={() => setIsExpanded(!isExpanded)}
          leftIcon={<FunnelIcon className="w-4 h-4" />}
        >
          Filtros
          {activeFilterCount > 0 && (
            <Badge variant="primary" size="sm" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleClearAll}
            className="p-2 text-dark-400 hover:text-red-500 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 space-y-4">
              {/* Period Presets */}
              <div>
                <label className="text-dark-400 text-sm mb-2 block">Período Rápido</label>
                <div className="flex flex-wrap gap-2">
                  {PERIOD_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePeriodPreset(preset.days)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Data Inicial"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
                />
                <Input
                  label="Data Final"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
                />
              </div>

              {/* Categories Multi-select */}
              <MultiSelect
                label="Categorias"
                placeholder="Selecione categorias..."
                options={CATEGORY_OPTIONS}
                value={filters.categories}
                onChange={(categories) => onChange({ ...filters, categories })}
              />

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <div className="pt-3 border-t border-dark-700">
                  <div className="flex flex-wrap gap-2">
                    {filters.search && (
                      <Badge variant="neutral" size="sm">
                        Busca: "{filters.search}"
                        <button
                          onClick={() => onChange({ ...filters, search: '' })}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {filters.type && (
                      <Badge variant="neutral" size="sm">
                        Tipo: {TYPE_OPTIONS.find((o) => o.value === filters.type)?.label}
                        <button
                          onClick={() => onChange({ ...filters, type: '' })}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {filters.categories.map((cat) => (
                      <Badge key={cat} variant="neutral" size="sm">
                        {CATEGORY_OPTIONS.find((o) => o.value === cat)?.label}
                        <button
                          onClick={() =>
                            onChange({
                              ...filters,
                              categories: filters.categories.filter((c) => c !== cat),
                            })
                          }
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                    {(filters.startDate || filters.endDate) && (
                      <Badge variant="neutral" size="sm">
                        Período: {filters.startDate || '...'} até {filters.endDate || '...'}
                        <button
                          onClick={() => onChange({ ...filters, startDate: '', endDate: '' })}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
