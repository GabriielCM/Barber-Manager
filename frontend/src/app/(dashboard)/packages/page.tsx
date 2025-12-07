'use client';

import { useState, useEffect } from 'react';
import { Package } from '@/types/package';
import { Plus, Edit, Trash2, Package as PackageIcon } from 'lucide-react';
import CreatePackageModal from './components/CreatePackageModal';

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, [filter]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const filterParam = filter === 'all' ? '' : `?isActive=${filter === 'active'}`;
      const response = await fetch(`http://localhost:3001/api/packages${filterParam}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setPackages(data);
    } catch (error) {
      console.error('Erro ao carregar pacotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Tem certeza que deseja desativar este pacote?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/packages/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        fetchPackages();
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao desativar pacote');
      }
    } catch (error) {
      console.error('Erro ao desativar pacote:', error);
      alert('Erro ao desativar pacote');
    }
  };

  const getPlanTypeLabel = (planType: string) => {
    return planType === 'WEEKLY' ? 'Semanal' : 'Quinzenal';
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pacotes de Assinatura</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={20} />
          Novo Pacote
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Ativos
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'inactive'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Inativos
        </button>
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Carregando pacotes...</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <PackageIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Nenhum pacote encontrado</p>
          <p className="text-sm text-gray-500 mt-2">
            Crie seu primeiro pacote para começar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                pkg.isActive ? 'border-green-200' : 'border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {pkg.name}
                  </h3>
                  {pkg.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {pkg.description}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    pkg.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {pkg.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Frequência:</span>
                  <span className="font-medium">
                    {getPlanTypeLabel(pkg.planType)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Preço base:</span>
                  <span className="font-medium">
                    R$ {pkg.basePrice.toFixed(2)}
                  </span>
                </div>
                {pkg.discountAmount > 0 && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Desconto:</span>
                    <span className="font-medium text-green-600">
                      - R$ {pkg.discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span className="text-blue-600">
                    R$ {pkg.finalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Serviços incluídos:
                </p>
                <ul className="text-sm space-y-1">
                  {pkg.services.map((service) => (
                    <li key={service.id} className="flex justify-between">
                      <span className="text-gray-600">{service.name}</span>
                      <span className="text-gray-500">
                        {service.duration} min
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => alert('Modal de edição será implementado')}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  <Edit size={16} />
                  Editar
                </button>
                {pkg.isActive && (
                  <button
                    onClick={() => handleDeactivate(pkg.id)}
                    className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Desativar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreatePackageModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchPackages();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}
