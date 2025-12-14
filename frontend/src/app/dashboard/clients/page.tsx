'use client';

import { useEffect, useState, useMemo } from 'react';
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
  StatCard,
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
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
// AVATAR COMPONENT
// ============================================
function ClientAvatar({ name, status }: { name: string; status: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-gradient-to-br from-green-500 to-green-600',
    INACTIVE: 'bg-gradient-to-br from-gray-500 to-gray-600',
    BANNED: 'bg-gradient-to-br from-red-500 to-red-600',
    DEFAULTER: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
  };

  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${statusColors[status] || statusColors.INACTIVE}`}
    >
      {initials}
    </div>
  );
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

  // Computed stats
  const stats = useMemo(() => {
    const activeClients = clients.filter((c) => c.status === 'ACTIVE').length;
    const inactiveClients = clients.filter((c) => c.status === 'INACTIVE').length;
    const defaulterClients = clients.filter((c) => c.status === 'DEFAULTER').length;
    const totalRevenue = clients.reduce((acc, c) => acc + Number(c.totalSpent || 0), 0);
    const topSpenders = clients
      .filter((c) => Number(c.totalSpent) > 0)
      .sort((a, b) => Number(b.totalSpent) - Number(a.totalSpent))
      .slice(0, 3);

    return {
      total: clients.length,
      active: activeClients,
      inactive: inactiveClients,
      defaulter: defaulterClients,
      totalRevenue,
      topSpenders,
    };
  }, [clients]);

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
      key: 'client',
      header: 'Cliente',
      sortable: true,
      render: (client: Client) => (
        <div className="flex items-center gap-3">
          <ClientAvatar name={client.name} status={client.status} />
          <div>
            <p className="font-medium text-white">{client.name}</p>
            <p className="text-dark-400 text-sm">{client.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contato',
      render: (client: Client) => (
        <div className="space-y-1">
          {client.email && (
            <p className="text-dark-300 text-sm flex items-center gap-1.5">
              <EnvelopeIcon className="w-4 h-4 text-dark-500" />
              {client.email}
            </p>
          )}
          {client.birthDate && (
            <p className="text-dark-400 text-sm flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-dark-500" />
              {format(parseISO(client.birthDate), "dd 'de' MMM", { locale: ptBR })}
            </p>
          )}
          {!client.email && !client.birthDate && (
            <span className="text-dark-500 text-sm">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (client: Client) => (
        <Badge
          variant={statusConfig[client.status]?.variant || 'neutral'}
          size="sm"
          dot
        >
          {statusConfig[client.status]?.label || client.status}
        </Badge>
      ),
    },
    {
      key: 'metrics',
      header: 'Métricas',
      sortable: true,
      render: (client: Client) => (
        <div className="space-y-1">
          <p className="text-green-500 font-semibold flex items-center gap-1.5">
            <CurrencyDollarIcon className="w-4 h-4" />
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(Number(client.totalSpent))}
          </p>
          {client.noShowCount > 0 && (
            <span className="text-red-400 text-sm flex items-center gap-1">
              <XCircleIcon className="w-3.5 h-3.5" />
              {client.noShowCount} falta{client.noShowCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (client: Client) => (
        <div className="flex items-center gap-1 justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
            title="Ver detalhes"
          >
            <EyeIcon className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openModal(client)}
            className="p-2 text-dark-400 hover:text-primary-500 hover:bg-dark-700 rounded-lg transition-all"
            title="Editar"
          >
            <PencilIcon className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openDeleteDialog(client)}
            className="p-2 text-dark-400 hover:text-red-500 hover:bg-dark-700 rounded-lg transition-all"
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

      <div className="p-8 space-y-6">
        {/* Stats Cards */}
        {!isLoading && clients.length > 0 && (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StaggerItem>
              <StatCard
                title="Total de Clientes"
                value={<AnimatedNumber value={stats.total} />}
                icon={<UserGroupIcon className="w-8 h-8" />}
                iconColor="text-primary-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Clientes Ativos"
                value={<AnimatedNumber value={stats.active} />}
                subtitle={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% do total`}
                icon={<CheckCircleIcon className="w-8 h-8" />}
                iconColor="text-green-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Inadimplentes"
                value={<AnimatedNumber value={stats.defaulter} />}
                icon={<ExclamationTriangleIcon className="w-8 h-8" />}
                iconColor="text-yellow-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Receita Total"
                value={<AnimatedCurrency value={stats.totalRevenue} />}
                icon={<CurrencyDollarIcon className="w-8 h-8" />}
                iconColor="text-green-500"
              />
            </StaggerItem>
          </StaggerContainer>
        )}

        {/* Top Spenders */}
        {!isLoading && stats.topSpenders.length > 0 && (
          <FadeIn delay={0.2}>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <StarIcon className="w-5 h-5 text-yellow-500" />
                <h3 className="text-white font-medium">Top Clientes</h3>
              </div>
              <div className="flex flex-wrap gap-4">
                {stats.topSpenders.map((client, index) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                    className="flex items-center gap-3 px-4 py-2 bg-dark-800 rounded-lg cursor-pointer hover:bg-dark-700 transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-bold">
                      {index + 1}
                    </div>
                    <ClientAvatar name={client.name} status={client.status} />
                    <div>
                      <p className="text-white text-sm font-medium">{client.name}</p>
                      <p className="text-green-500 text-xs font-semibold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(Number(client.totalSpent))}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </FadeIn>
        )}

        {/* Actions Bar */}
        <FadeIn>
          <Card className="p-4">
            <div className="flex items-center justify-between">
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
                  className="w-44"
                />
              </div>

              <Button
                onClick={() => openModal()}
                leftIcon={<PlusIcon className="w-5 h-5" />}
              >
                Novo Cliente
              </Button>
            </div>
          </Card>
        </FadeIn>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={8} columns={5} />
        ) : clients.length === 0 ? (
          <FadeIn delay={0.1}>
            <EmptyState
              icon={<UserGroupIcon className="w-16 h-16" />}
              title="Nenhum cliente encontrado"
              description={search || statusFilter ? "Tente ajustar os filtros de busca" : "Comece cadastrando seu primeiro cliente"}
              action={
                !search && !statusFilter ? (
                  <Button onClick={() => openModal()}>
                    Cadastrar Cliente
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => { setSearch(''); setStatusFilter(''); }}>
                    Limpar Filtros
                  </Button>
                )
              }
            />
          </FadeIn>
        ) : (
          <FadeIn delay={0.1}>
            <Card padding="none" className="overflow-hidden">
              <Table
                data={clients}
                columns={columns}
                keyExtractor={(client) => client.id}
              />
            </Card>
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
