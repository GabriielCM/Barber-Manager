'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  Button,
  Input,
  Textarea,
  SearchInput,
  Select,
  Badge,
  Card,
  Table,
  TableSkeleton,
  DeleteConfirmDialog,
  AnimatedCurrency,
  AnimatedNumber,
  DatePicker,
  PhoneInput,
  Modal,
  RadioGroup,
} from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { clientsApi } from '@/lib/api';
import { Client } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  EyeIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

// ============================================
// STATUS CONFIG
// ============================================
const statusConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; label: string }> = {
  ACTIVE: { variant: 'success', label: 'Ativo' },
  INACTIVE: { variant: 'neutral', label: 'Inativo' },
  BANNED: { variant: 'danger', label: 'Banido' },
  DEFAULTER: { variant: 'warning', label: 'Inadimplente' },
};

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVE', label: 'Ativos' },
  { value: 'INACTIVE', label: 'Inativos' },
  { value: 'BANNED', label: 'Banidos' },
  { value: 'DEFAULTER', label: 'Inadimplentes' },
];

const statusFormOptions = [
  { value: 'ACTIVE', label: 'Ativo', description: 'Cliente pode agendar normalmente' },
  { value: 'INACTIVE', label: 'Inativo', description: 'Cliente não ativo no momento' },
  { value: 'BANNED', label: 'Banido', description: 'Cliente bloqueado' },
  { value: 'DEFAULTER', label: 'Inadimplente', description: 'Cliente com pendências' },
];

interface ClientFormData {
  name: string;
  phone: string;
  email?: string;
  birthDate?: Date | null;
  observations?: string;
  status: string;
}

// ============================================
// MAIN PAGE
// ============================================
export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; client: Client | null }>({
    isOpen: false,
    client: null,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      birthDate: null,
      observations: '',
      status: 'ACTIVE',
    },
  });

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setClients(response.data.clients);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, statusFilter]);

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      reset({
        name: client.name,
        phone: client.phone,
        email: client.email || '',
        birthDate: client.birthDate ? parseISO(client.birthDate) : null,
        observations: client.observations || '',
        status: client.status,
      });
    } else {
      setEditingClient(null);
      reset({
        name: '',
        phone: '',
        email: '',
        birthDate: null,
        observations: '',
        status: 'ACTIVE',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    reset();
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      const payload = {
        ...data,
        birthDate: data.birthDate ? format(data.birthDate, 'yyyy-MM-dd') : undefined,
      };

      if (editingClient) {
        await clientsApi.update(editingClient.id, payload);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await clientsApi.create(payload);
        toast.success('Cliente criado com sucesso!');
      }
      closeModal();
      fetchClients();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar cliente');
    }
  };

  const openDeleteDialog = (client: Client) => {
    setDeleteDialog({ isOpen: true, client });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, client: null });
  };

  const handleDelete = async () => {
    if (!deleteDialog.client) return;

    try {
      await clientsApi.delete(deleteDialog.client.id);
      toast.success('Cliente excluído com sucesso!');
      fetchClients();
      closeDeleteDialog();
    } catch (error) {
      toast.error('Erro ao excluir cliente');
    }
  };

  // ============================================
  // TABLE COLUMNS
  // ============================================
  const columns = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (client: Client) => (
        <span className="font-medium text-white">{client.name}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Telefone',
      render: (client: Client) => client.phone,
    },
    {
      key: 'email',
      header: 'Email',
      render: (client: Client) => client.email || '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (client: Client) => (
        <Badge
          variant={statusConfig[client.status]?.variant || 'neutral'}
          size="sm"
        >
          {statusConfig[client.status]?.label || client.status}
        </Badge>
      ),
    },
    {
      key: 'totalSpent',
      header: 'Total Gasto',
      sortable: true,
      render: (client: Client) => (
        <span className="text-green-500 font-medium">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(Number(client.totalSpent))}
        </span>
      ),
    },
    {
      key: 'noShowCount',
      header: 'Faltas',
      render: (client: Client) => (
        client.noShowCount > 0 ? (
          <span className="text-red-500 font-medium">{client.noShowCount}</span>
        ) : (
          <span className="text-dark-400">0</span>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (client: Client) => (
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
            title="Ver detalhes"
          >
            <EyeIcon className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openModal(client)}
            className="p-2 text-dark-400 hover:text-primary-500 hover:bg-dark-700 rounded-lg transition-colors"
            title="Editar"
          >
            <PencilIcon className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openDeleteDialog(client)}
            className="p-2 text-dark-400 hover:text-red-500 hover:bg-dark-700 rounded-lg transition-colors"
            title="Excluir"
          >
            <TrashIcon className="w-5 h-5" />
          </motion.button>
        </div>
      ),
    },
  ];

  return (
    <PageTransition>
      <Header
        title="Clientes"
        subtitle={`${total} clientes cadastrados`}
      />

      <div className="p-8">
        {/* Actions Bar */}
        <FadeIn>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <SearchInput
                placeholder="Buscar por nome ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
                className="w-80"
              />
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40"
              />
            </div>

            <Button
              onClick={() => openModal()}
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              Novo Cliente
            </Button>
          </div>
        </FadeIn>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : clients.length === 0 ? (
          <FadeIn delay={0.1}>
            <EmptyState
              icon={<UserGroupIcon className="w-16 h-16" />}
              title="Nenhum cliente encontrado"
              description="Comece cadastrando seu primeiro cliente"
              action={
                <Button onClick={() => openModal()}>
                  Cadastrar Cliente
                </Button>
              }
            />
          </FadeIn>
        ) : (
          <FadeIn delay={0.1}>
            <Table
              data={clients}
              columns={columns}
              keyExtractor={(client) => client.id}
            />
          </FadeIn>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Nome */}
          <Input
            label="Nome completo"
            placeholder="Nome do cliente"
            leftIcon={<UserIcon className="w-5 h-5" />}
            required
            error={errors.name?.message as string}
            {...register('name', { required: 'Nome é obrigatório' })}
          />

          {/* Telefone e Email em grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="phone"
              control={control}
              rules={{ required: 'Telefone é obrigatório' }}
              render={({ field }) => (
                <PhoneInput
                  label="Telefone"
                  value={field.value || ''}
                  onChange={field.onChange}
                  error={errors.phone?.message as string}
                  placeholder="(34) 99876-5432"
                  required
                />
              )}
            />

            <Input
              label="Email"
              type="email"
              placeholder="email@exemplo.com"
              leftIcon={<EnvelopeIcon className="w-5 h-5" />}
              {...register('email')}
            />
          </div>

          {/* Data de Nascimento */}
          <Controller
            name="birthDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Data de Nascimento"
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecione a data"
                maxDate={new Date()}
              />
            )}
          />

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-3">
              Status do Cliente
            </label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  name="status"
                  value={field.value}
                  onChange={field.onChange}
                  options={statusFormOptions}
                  direction="horizontal"
                />
              )}
            />
          </div>

          {/* Observações */}
          <Textarea
            label="Observações"
            placeholder="Preferências, alergias, informações importantes..."
            {...register('observations')}
            rows={3}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
            >
              {editingClient ? 'Atualizar' : 'Criar Cliente'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Excluir Cliente"
        itemName={deleteDialog.client?.name || ''}
      />
    </PageTransition>
  );
}
