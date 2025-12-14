'use client';

import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  Button,
  Input,
  Textarea,
  Badge,
  Card,
  StatCard,
  CardSkeleton,
  DeleteConfirmDialog,
  Modal,
  CurrencyInput,
  SearchInput,
  AnimatedNumber,
  AnimatedCurrency,
  Switch,
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
  CurrencyDollarIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface ServiceFormData {
  name: string;
  description: string;
  price: number;
  duration: number;
  isActive: boolean;
}

// Duration options for quick selection
const durationOptions = [15, 30, 45, 60, 90, 120];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; service: Service | null }>({
    isOpen: false,
    service: null,
  });

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<ServiceFormData>({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      duration: 30,
      isActive: true,
    }
  });

  const watchDuration = watch('duration');

  // Computed stats
  const stats = useMemo(() => {
    const activeServices = services.filter((s) => s.isActive);
    const avgPrice = activeServices.length > 0
      ? activeServices.reduce((acc, s) => acc + Number(s.price), 0) / activeServices.length
      : 0;
    const avgDuration = activeServices.length > 0
      ? Math.round(activeServices.reduce((acc, s) => acc + s.duration, 0) / activeServices.length)
      : 0;
    const mostExpensive = activeServices.length > 0
      ? activeServices.reduce((max, s) => Number(s.price) > Number(max.price) ? s : max, activeServices[0])
      : null;

    return {
      total: services.length,
      active: activeServices.length,
      inactive: services.length - activeServices.length,
      avgPrice,
      avgDuration,
      mostExpensive,
    };
  }, [services]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch = search
        ? service.name.toLowerCase().includes(search.toLowerCase()) ||
          service.description?.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesStatus = showInactive ? true : service.isActive;
      return matchesSearch && matchesStatus;
    });
  }, [services, search, showInactive]);

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
        isActive: service.isActive,
      });
    } else {
      setEditingService(null);
      reset({ name: '', description: '', price: 0, duration: 30, isActive: true });
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <PageTransition>
      <Header title="Serviços" subtitle={`${stats.active} serviços ativos`} />

      <div className="p-8 space-y-6">
        {/* Stats Cards */}
        {!isLoading && services.length > 0 && (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StaggerItem>
              <StatCard
                title="Total de Serviços"
                value={<AnimatedNumber value={stats.total} />}
                subtitle={`${stats.active} ativos`}
                icon={<WrenchScrewdriverIcon className="w-8 h-8" />}
                iconColor="text-primary-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Preço Médio"
                value={<AnimatedCurrency value={stats.avgPrice} />}
                icon={<CurrencyDollarIcon className="w-8 h-8" />}
                iconColor="text-green-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Duração Média"
                value={`${stats.avgDuration} min`}
                icon={<ClockIcon className="w-8 h-8" />}
                iconColor="text-blue-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Serviço Premium"
                value={stats.mostExpensive ? formatCurrency(Number(stats.mostExpensive.price)) : '-'}
                subtitle={stats.mostExpensive?.name || ''}
                icon={<SparklesIcon className="w-8 h-8" />}
                iconColor="text-yellow-500"
              />
            </StaggerItem>
          </StaggerContainer>
        )}

        {/* Actions Bar */}
        <FadeIn>
          <Card className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <SearchInput
                  placeholder="Buscar serviço..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClear={() => setSearch('')}
                  className="w-72"
                />
                <label className="flex items-center gap-2 text-sm text-dark-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500"
                  />
                  Mostrar inativos
                </label>
              </div>

              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center bg-dark-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-primary-500 text-white'
                        : 'text-dark-400 hover:text-white'
                    }`}
                  >
                    <Squares2X2Icon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-primary-500 text-white'
                        : 'text-dark-400 hover:text-white'
                    }`}
                  >
                    <ListBulletIcon className="w-5 h-5" />
                  </button>
                </div>

                <Button
                  onClick={() => openModal()}
                  leftIcon={<PlusIcon className="w-5 h-5" />}
                >
                  Novo Serviço
                </Button>
              </div>
            </div>
          </Card>
        </FadeIn>

        {/* Services Grid/List */}
        {isLoading ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <FadeIn delay={0.1}>
            <EmptyState
              icon={<WrenchScrewdriverIcon className="w-16 h-16" />}
              title={search ? "Nenhum serviço encontrado" : "Nenhum serviço cadastrado"}
              description={search ? "Tente ajustar sua busca" : "Comece cadastrando seu primeiro serviço"}
              action={
                search ? (
                  <Button variant="secondary" onClick={() => setSearch('')}>
                    Limpar Busca
                  </Button>
                ) : (
                  <Button onClick={() => openModal()}>Cadastrar Serviço</Button>
                )
              }
            />
          </FadeIn>
        ) : viewMode === 'grid' ? (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredServices.map((service) => (
                <StaggerItem key={service.id}>
                  <Card
                    hoverable
                    className={`h-full relative ${!service.isActive ? 'opacity-60' : ''}`}
                  >
                    {/* Status indicator */}
                    <div className="absolute top-4 right-4">
                      <Badge
                        variant={service.isActive ? 'success' : 'neutral'}
                        size="sm"
                        dot
                      >
                        {service.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    {/* Service Info */}
                    <div className="mb-4 pr-20">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="text-dark-400 text-sm line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>

                    {/* Price and Duration */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-lg">
                        <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
                        <span className="text-green-500 font-bold text-lg">
                          {formatCurrency(service.price)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-lg">
                        <ClockIcon className="w-5 h-5 text-blue-500" />
                        <span className="text-blue-500 font-medium">
                          {formatDuration(service.duration)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-dark-700">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => openModal(service)}
                        leftIcon={<PencilIcon className="w-4 h-4" />}
                      >
                        Editar
                      </Button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openDeleteDialog(service)}
                        className="p-2 text-dark-400 hover:text-red-500 hover:bg-dark-700 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </Card>
                </StaggerItem>
              ))}
            </AnimatePresence>
          </StaggerContainer>
        ) : (
          /* List View */
          <FadeIn delay={0.1}>
            <Card padding="none" className="overflow-hidden">
              <div className="divide-y divide-dark-800">
                <AnimatePresence mode="popLayout">
                  {filteredServices.map((service, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center justify-between p-4 hover:bg-dark-800/50 transition-colors ${
                        !service.isActive ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center">
                          <WrenchScrewdriverIcon className="w-6 h-6 text-primary-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white truncate">
                              {service.name}
                            </h3>
                            <Badge
                              variant={service.isActive ? 'success' : 'neutral'}
                              size="sm"
                            >
                              {service.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          {service.description && (
                            <p className="text-dark-400 text-sm truncate">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-green-500 font-bold">
                            {formatCurrency(service.price)}
                          </p>
                          <p className="text-dark-400 text-sm">
                            {formatDuration(service.duration)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openModal(service)}
                            className="p-2 text-dark-400 hover:text-primary-500 hover:bg-dark-700 rounded-lg transition-colors"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openDeleteDialog(service)}
                            className="p-2 text-dark-400 hover:text-red-500 hover:bg-dark-700 rounded-lg transition-colors"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </Card>
          </FadeIn>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingService ? 'Editar Serviço' : 'Novo Serviço'} size="md">
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

          {/* Preço */}
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

          {/* Duração com seleção visual */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-3">
              Duração <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {durationOptions.map((duration) => (
                <motion.button
                  key={duration}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setValue('duration', duration)}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                    watchDuration === duration
                      ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                      : 'border-dark-700 bg-dark-800 text-dark-300 hover:border-dark-600'
                  }`}
                >
                  {formatDuration(duration)}
                </motion.button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={5}
                step={5}
                placeholder="Personalizado"
                leftIcon={<ClockIcon className="w-5 h-5" />}
                className="flex-1"
                error={errors.duration?.message as string}
                {...register('duration', {
                  required: 'Duração é obrigatória',
                  min: { value: 5, message: 'Mínimo 5 minutos' },
                  valueAsNumber: true,
                })}
              />
              <span className="text-dark-400 text-sm">minutos</span>
            </div>
          </div>

          {/* Status Switch */}
          {editingService && (
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Serviço ativo</p>
                    <p className="text-dark-400 text-sm">
                      Serviços inativos não aparecem para agendamento
                    </p>
                  </div>
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                  />
                </div>
              )}
            />
          )}

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
