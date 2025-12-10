'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import {
  DocumentArrowDownIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { financialApi, api } from '@/lib/api';
import toast from 'react-hot-toast';

interface ExportButtonsProps {
  startDate: string;
  endDate: string;
  disabled?: boolean;
}

export function ExportButtons({ startDate, endDate, disabled }: ExportButtonsProps) {
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    try {
      const response = await api.get('/financial/export/csv', {
        params: { startDate, endDate },
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financeiro_${startDate}_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('CSV exportado com sucesso!');
    } catch (error: any) {
      console.error('Error exporting CSV:', error);
      toast.error(error.response?.data?.message || 'Erro ao exportar CSV');
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const response = await api.get('/financial/export/pdf', {
        params: { startDate, endDate },
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_financeiro_${startDate}_${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('PDF exportado com sucesso!');
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      toast.error(error.response?.data?.message || 'Erro ao exportar PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCSV}
          isLoading={isExportingCSV}
          disabled={disabled || isExportingCSV || isExportingPDF}
          leftIcon={<DocumentArrowDownIcon className="w-4 h-4" />}
        >
          CSV
        </Button>
      </motion.div>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportPDF}
          isLoading={isExportingPDF}
          disabled={disabled || isExportingCSV || isExportingPDF}
          leftIcon={<DocumentTextIcon className="w-4 h-4" />}
        >
          PDF
        </Button>
      </motion.div>
    </div>
  );
}
