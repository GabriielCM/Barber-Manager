'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import {
  PageTransition,
  FadeIn,
  Button,
  Input,
  Textarea,
  Badge,
  Table,
  TableSkeleton,
  DeleteConfirmDialog,
} from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { servicesApi } from '@/lib/api';
import { Service } from '@/types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; service: Service | null }>({
    isOpen: false,
    service: null,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const fetchServices = async () => {
    try {
      const response = await servicesApi.getAll(false);
      setServices(response.data);
    } catch (error) {
      toast.error('Erro ao carregar serviços');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const openModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      reset({
        name: service.name,
        description: service.description || '',
        price: service.price,
        duration: service.duration,
      });
    } else {
      setEditingService(null);
      reset({ name: '', description: '', price: '', duration: 30 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    reset();
  };

  const onSubmit = async (data: any) => {
    const payload = { ...data, price: Number(data.price), duration: Number(data.duration) };
    try {
      if (editingService) {
        await servicesApi.update(editingService.id, payload);
        toast.success('Serviço atualizado!');
      } else {
        await servicesApi.create(payload);
        toast.success('Serviço criado!');
      }
      closeModal();
      fetchServices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar');
    }
  };

  const openDeleteDialog = (service: Service) => {
    setDeleteDialog({ isOpen: true, service });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, service: null });
  };

  const handleDelete = async () => {
    if (!deleteDialog.service) return;
    try {
      await servicesApi.delete(deleteDialog.service.id);
      toast.success('Serviço desativado!');
      fetchServices();
      closeDeleteDialog();
    } catch (error) {
      toast.error('Erro ao desativar');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Table columns
  const columns = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (service: Service) => (
        <span className="font-medium text-white">{service.name}</span>
      ),
    },
    {
      key: 'description',
      header: 'Descrição',
      render: (service: Service) => (
        <span className="text-dark-400 max-w-xs truncate block">{service.description || '-'}</span>
      ),
    },
    {
      key: 'price',
      header: 'Preço',
      sortable: true,
      render: (service: Service) => (
        <span className="text-green-500 font-semibold">{formatCurrency(service.price)}</span>
      ),
    },
    {
      key: 'duration',
      header: 'Duração',
      render: (service: Service) => `${service.duration} min`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (service: Service) => (
        <Badge variant={service.isActive ? 'success' : 'neutral'} size="sm">
          {service.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (service: Service) => (
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openModal(service)}
            className="p-2 text-dark-400 hover:text-primary-500 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <PencilIcon className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openDeleteDialog(service)}
            className="p-2 text-dark-400 hover:text-red-500 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
          </motion.button>
        </div>
      ),
    },
  ];

  return (
    <PageTransition>
      <Header title="Serviços" subtitle={`${services.length} serviços`} />

      <div className="p-8">
        <FadeIn>
          <div className="flex justify-end mb-6">
            <Button
              onClick={() => openModal()}
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              Novo Serviço
            </Button>
          </div>
        </FadeIn>

        {isLoading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : services.length === 0 ? (
          <FadeIn delay={0.1}>
            <EmptyState
              icon={<WrenchScrewdriverIcon className="w-16 h-16" />}
              title="Nenhum serviço cadastrado"
              action={<Button onClick={() => openModal()}>Cadastrar</Button>}
            />
          </FadeIn>
        ) : (
          <FadeIn delay={0.1}>
            <Table
              data={services}
              columns={columns}
              keyExtractor={(service) => service.id}
            />
          </FadeIn>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingService ? 'Editar Serviço' : 'Novo Serviço'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome"
            required
            error={errors.name?.message as string}
            {...register('name', { required: 'Obrigatório' })}
          />
          <Textarea
            label="Descrição"
            {...register('description')}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Preço (R$)"
              type="number"
              step="0.01"
              required
              error={errors.price?.message as string}
              {...register('price', { required: 'Obrigatório' })}
            />
            <Input
              label="Duração (min)"
              type="number"
              required
              error={errors.duration?.message as string}
              {...register('duration', { required: 'Obrigatório' })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingService ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Desativar Serviço"
        itemName={deleteDialog.service?.name || ''}
      />
    </PageTransition>
  );
}
