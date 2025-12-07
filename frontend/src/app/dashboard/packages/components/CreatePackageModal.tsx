'use client';

import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { CreatePackageRequest, SubscriptionPlanType } from '@/types/package';

interface Service {
  id: string;
  name: string;
  price: number | string;
  duration: number | string;
}

interface CreatePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper function to safely convert to number
const toNumber = (value: number | string | undefined | null): number => {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

export default function CreatePackageModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePackageModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState<CreatePackageRequest>({
    name: '',
    description: '',
    planType: 'WEEKLY',
    serviceIds: [],
    discountAmount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/services', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      // Normalize service data to ensure price and duration are numbers
      const normalizedServices = data
        .filter((s: Service) => s)
        .map((s: Service) => ({
          ...s,
          price: toNumber(s.price),
          duration: toNumber(s.duration),
        }));
      setServices(normalizedServices);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  // Use useMemo to calculate derived values without causing re-renders
  const selectedServices = useMemo(
    () => services.filter((s) => formData.serviceIds.includes(s.id)),
    [services, formData.serviceIds]
  );

  const basePrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + toNumber(s.price), 0),
    [selectedServices]
  );

  const finalPrice = useMemo(
    () => Math.max(0, basePrice - (formData.discountAmount || 0)),
    [basePrice, formData.discountAmount]
  );

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + toNumber(s.duration), 0),
    [selectedServices]
  );

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (formData.serviceIds.length === 0) {
      newErrors.serviceIds = 'Selecione pelo menos um serviço';
    }

    if (formData.discountAmount && formData.discountAmount > basePrice) {
      newErrors.discountAmount = 'Desconto não pode ser maior que o preço base';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        handleClose();
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao criar pacote');
      }
    } catch (error) {
      console.error('Erro ao criar pacote:', error);
      alert('Erro ao criar pacote');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      planType: 'WEEKLY',
      serviceIds: [],
      discountAmount: 0,
    });
    setErrors({});
    onClose();
  };

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-dark-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-dark-700">
        <div className="flex justify-between items-center p-6 border-b border-dark-700">
          <h2 className="text-2xl font-bold text-white">Criar Novo Pacote</h2>
          <button
            onClick={handleClose}
            className="text-dark-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Nome */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Nome do Pacote *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full px-3 py-2 bg-dark-800 border rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.name ? 'border-red-500' : 'border-dark-700'
              }`}
              placeholder="Ex: Pacote Completo Mensal"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Descreva o pacote..."
            />
          </div>

          {/* Frequência */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Frequência *
            </label>
            <select
              value={formData.planType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  planType: e.target.value as SubscriptionPlanType,
                })
              }
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="WEEKLY">Semanal (a cada 7 dias)</option>
              <option value="BIWEEKLY">Quinzenal (a cada 14 dias)</option>
            </select>
          </div>

          {/* Seleção de Serviços */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Serviços Incluídos *
            </label>
            <div className="border border-dark-700 rounded-lg p-4 max-h-48 overflow-y-auto bg-dark-800">
              {services.length === 0 ? (
                <p className="text-dark-400 text-center">
                  Carregando serviços...
                </p>
              ) : (
                services.map((service) => {
                  const price = toNumber(service.price);
                  const duration = toNumber(service.duration);

                  return (
                    <label
                      key={service.id}
                      className="flex items-center p-2 hover:bg-dark-700 rounded cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.serviceIds.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                        className="mr-3 h-4 w-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
                      />
                      <span className="flex-1 text-white">{service.name}</span>
                      <span className="text-sm text-dark-400">
                        R$ {price.toFixed(2)} | {duration} min
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            {errors.serviceIds && (
              <p className="text-red-500 text-sm mt-1">{errors.serviceIds}</p>
            )}
          </div>

          {/* Resumo de Preços */}
          {selectedServices.length > 0 && (
            <div className="mb-4 bg-dark-800 border border-dark-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-white">Resumo:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">Serviços selecionados:</span>
                  <span className="font-medium text-white">{selectedServices.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Duração total:</span>
                  <span className="font-medium text-white">{totalDuration} minutos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Preço base:</span>
                  <span className="font-medium text-white">
                    R$ {basePrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Desconto */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Desconto (R$)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.discountAmount || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discountAmount: parseFloat(e.target.value) || 0,
                })
              }
              className={`w-full px-3 py-2 bg-dark-800 border rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.discountAmount ? 'border-red-500' : 'border-dark-700'
              }`}
              placeholder="0.00"
            />
            {errors.discountAmount && (
              <p className="text-red-500 text-sm mt-1">
                {errors.discountAmount}
              </p>
            )}
          </div>

          {/* Preço Final */}
          {selectedServices.length > 0 && (
            <div className="mb-6 bg-green-900/30 border border-green-700 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-white">Preço Final:</span>
                <span className="text-2xl font-bold text-green-500">
                  R$ {finalPrice.toFixed(2)}
                </span>
              </div>
              {formData.discountAmount && formData.discountAmount > 0 && (
                <p className="text-sm text-dark-400 mt-2">
                  Economia de R$ {formData.discountAmount.toFixed(2)} por pacote
                </p>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-dark-600 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-dark-600 disabled:text-dark-400 transition-colors"
            >
              {loading ? 'Criando...' : 'Criar Pacote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
