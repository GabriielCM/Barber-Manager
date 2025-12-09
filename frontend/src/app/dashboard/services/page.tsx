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
  Modal,
  CurrencyInput,
} from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { servicesApi } from '@/lib/api';
import { Service } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface ServiceFormData {
  name: string;
  description: string;
  price: number;
  duration: number;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; service: Service | null }>({
    isOpen: false,
    service: null,
  });

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<ServiceFormData>({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      duration: 30,
    }
  });

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
        price: Number(service.price),
        duration: service.duration,
      });
    } else {
      setEditingService(null);
      reset({ name: '', description: '', price: 0, duration: 30 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    reset();
  };

  const onSubmit = async (data: ServiceFormData) => {
    const payload = {
      ...data,
      price: Number(data.price),
      duration: Number(data.duration)
    };

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Nome */}
          <Input
            label="Nome do serviço"
            placeholder="Ex: Corte Masculino"
            leftIcon={<WrenchScrewdriverIcon className="w-5 h-5" />}
            required
            error={errors.name?.message as string}
            {...register('name', { required: 'Nome é obrigatório' })}
          />

          {/* Descrição */}
          <Textarea
            label="Descrição"
            placeholder="Descreva o serviço oferecido..."
            {...register('description')}
            rows={3}
          />

          {/* Preço e Duração em grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="price"
              control={control}
              rules={{ required: 'Preço é obrigatório', min: { value: 0.01, message: 'Preço deve ser maior que zero' } }}
              render={({ field }) => (
                <CurrencyInput
                  label="Preço"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.price?.message as string}
                  required
                />
              )}
            />

            <Input
              label="Duração"
              type="number"
              min={5}
              step={5}
              placeholder="30"
              leftIcon={<ClockIcon className="w-5 h-5" />}
              helperText="Tempo em minutos"
              required
              error={errors.duration?.message as string}
              {...register('duration', {
                required: 'Duração é obrigatória',
                min: { value: 5, message: 'Mínimo 5 minutos' }
              })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingService ? 'Atualizar' : 'Criar Serviço'}
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
