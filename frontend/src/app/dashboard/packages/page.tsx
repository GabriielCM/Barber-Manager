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
        <h1 className="text-3xl font-bold text-white">Pacotes de Assinatura</h1>
        <button
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
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
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'active'
              ? 'bg-primary-600 text-white'
              : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
          }`}
        >
          Ativos
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'inactive'
              ? 'bg-primary-600 text-white'
              : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
          }`}
        >
          Inativos
        </button>
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-dark-400">Carregando pacotes...</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12 bg-dark-800 rounded-lg border border-dark-700">
          <PackageIcon size={48} className="mx-auto text-dark-500 mb-4" />
          <p className="text-dark-300">Nenhum pacote encontrado</p>
          <p className="text-sm text-dark-500 mt-2">
            Crie seu primeiro pacote para começar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-dark-800 rounded-lg p-6 border ${
                pkg.isActive ? 'border-green-700' : 'border-dark-700'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white">
                    {pkg.name}
                  </h3>
                  {pkg.description && (
                    <p className="text-sm text-dark-400 mt-1">
                      {pkg.description}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    pkg.isActive
                      ? 'bg-green-900/50 text-green-400'
                      : 'bg-dark-700 text-dark-400'
                  }`}
                >
                  {pkg.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-dark-400">Frequência:</span>
                  <span className="font-medium text-white">
                    {getPlanTypeLabel(pkg.planType)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-dark-400">Preço base:</span>
                  <span className="font-medium text-white">
                    R$ {pkg.basePrice.toFixed(2)}
                  </span>
                </div>
                {pkg.discountAmount > 0 && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-dark-400">Desconto:</span>
                    <span className="font-medium text-green-500">
                      - R$ {pkg.discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-dark-700 pt-2 mt-2">
                  <span className="text-white">Total:</span>
                  <span className="text-primary-500">
                    R$ {pkg.finalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold text-dark-300 mb-2">
                  Serviços incluídos:
                </p>
                <ul className="text-sm space-y-1">
                  {pkg.services.map((service) => (
                    <li key={service.id} className="flex justify-between">
                      <span className="text-dark-400">{service.name}</span>
                      <span className="text-dark-500">
                        {service.duration} min
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => alert('Modal de edição será implementado')}
                  className="flex-1 bg-dark-700 text-dark-300 px-3 py-2 rounded hover:bg-dark-600 hover:text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit size={16} />
                  Editar
                </button>
                {pkg.isActive && (
                  <button
                    onClick={() => handleDeactivate(pkg.id)}
                    className="flex-1 bg-red-900/30 text-red-400 px-3 py-2 rounded hover:bg-red-900/50 flex items-center justify-center gap-2 transition-colors"
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
