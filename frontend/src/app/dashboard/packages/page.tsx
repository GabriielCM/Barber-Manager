'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  Button,
  Badge,
  Card,
  CardSkeleton,
  DeleteConfirmDialog,
} from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { Package } from '@/types/package';
import { PlusIcon, PencilIcon, TrashIcon, CubeIcon } from '@heroicons/react/24/outline';
import CreatePackageModal from './components/CreatePackageModal';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; package: Package | null }>({
    isOpen: false,
    package: null,
  });

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
      toast.error('Erro ao carregar pacotes');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (pkg: Package) => {
    setDeleteDialog({ isOpen: true, package: pkg });
  };

  const handleDeactivate = async () => {
    if (!deleteDialog.package) return;

    try {
      const response = await fetch(`http://localhost:3001/api/packages/${deleteDialog.package.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast.success('Pacote desativado!');
        fetchPackages();
        setDeleteDialog({ isOpen: false, package: null });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao desativar pacote');
      }
    } catch (error) {
      console.error('Erro ao desativar pacote:', error);
      toast.error('Erro ao desativar pacote');
    }
  };

  const getPlanTypeLabel = (planType: string) => {
    return planType === 'WEEKLY' ? 'Semanal' : 'Quinzenal';
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const filterButtons = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Ativos' },
    { value: 'inactive', label: 'Inativos' },
  ] as const;

  return (
    <PageTransition>
      <Header title="Pacotes de Assinatura" subtitle={`${packages.length} pacotes`} />

      <div className="p-8">
        <FadeIn>
          <div className="flex justify-between items-center mb-6">
            {/* Filters */}
            <div className="flex gap-2">
              {filterButtons.map((btn) => (
                <motion.button
                  key={btn.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFilter(btn.value)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === btn.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  {btn.label}
                </motion.button>
              ))}
            </div>

            <Button
              onClick={() => setShowCreateModal(true)}
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              Novo Pacote
            </Button>
          </div>
        </FadeIn>

        {/* Packages Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : packages.length === 0 ? (
          <FadeIn delay={0.1}>
            <EmptyState
              icon={<CubeIcon className="w-16 h-16" />}
              title="Nenhum pacote encontrado"
              description="Crie seu primeiro pacote para começar"
              action={<Button onClick={() => setShowCreateModal(true)}>Criar Pacote</Button>}
            />
          </FadeIn>
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <StaggerItem key={pkg.id}>
                <Card
                  hoverable
                  className={`h-full ${pkg.isActive ? 'border-green-700/50' : ''}`}
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
                    <Badge variant={pkg.isActive ? 'success' : 'neutral'}>
                      {pkg.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Frequência:</span>
                      <span className="font-medium text-white">
                        {getPlanTypeLabel(pkg.planType)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Preço base:</span>
                      <span className="font-medium text-white">
                        {formatCurrency(pkg.basePrice)}
                      </span>
                    </div>
                    {pkg.discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-dark-400">Desconto:</span>
                        <span className="font-medium text-green-500">
                          - {formatCurrency(pkg.discountAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t border-dark-700 pt-2 mt-2">
                      <span className="text-white">Total:</span>
                      <span className="text-primary-500">
                        {formatCurrency(pkg.finalPrice)}
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

                  <div className="flex gap-2 pt-4 border-t border-dark-700">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => toast.error('Modal de edição será implementado')}
                      leftIcon={<PencilIcon className="w-4 h-4" />}
                    >
                      Editar
                    </Button>
                    {pkg.isActive && (
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1"
                        onClick={() => openDeleteDialog(pkg)}
                        leftIcon={<TrashIcon className="w-4 h-4" />}
                      >
                        Desativar
                      </Button>
                    )}
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      {/* Create Modal */}
      <CreatePackageModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchPackages();
          setShowCreateModal(false);
        }}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, package: null })}
        onConfirm={handleDeactivate}
        title="Desativar Pacote"
        itemName={deleteDialog.package?.name || ''}
      />
    </PageTransition>
  );
}
