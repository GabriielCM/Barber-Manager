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
  Select,
  Badge,
  Card,
  CardTitle,
  CardSkeleton,
  AnimatedCurrency,
  AnimatedNumber,
  ConfirmDialog,
  Modal,
  PhoneInput,
  Switch,
  SearchableSelect,
  RadioGroup,
} from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { barbersApi } from '@/lib/api';
import { Barber, Appointment } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ScissorsIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  UserIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface BarberFormData {
  name: string;
  phone: string;
  email: string;
  specialties: string;
  isActive: boolean;
}

// Opções predefinidas de especialidades
const specialtyOptions: SelectOption<string>[] = [
  { value: 'Corte', label: 'Corte' },
  { value: 'Barba', label: 'Barba' },
  { value: 'Degradê', label: 'Degradê' },
  { value: 'Pigmentação', label: 'Pigmentação' },
  { value: 'Relaxamento', label: 'Relaxamento' },
  { value: 'Platinado', label: 'Platinado' },
  { value: 'Hidratação', label: 'Hidratação' },
  { value: 'Sobrancelha', label: 'Sobrancelha' },
];

const deactivateActionOptions = [
  {
    value: 'cancel',
    label: 'Cancelar tudo',
    description: 'Todos os agendamentos e assinaturas serão cancelados'
  },
  {
    value: 'transfer',
    label: 'Transferir',
    description: 'Os agendamentos e assinaturas serão transferidos para outro barbeiro'
  },
];

export default function BarbersPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [selectedBarberStats, setSelectedBarberStats] = useState<any>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // Deactivation modal state
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [barberToDeactivate, setBarberToDeactivate] = useState<Barber | null>(null);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);
  const [deactivateAction, setDeactivateAction] = useState<'transfer' | 'cancel'>('cancel');
  const [targetBarberId, setTargetBarberId] = useState<string>('');
  const [isDeactivating, setIsDeactivating] = useState(false);

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<BarberFormData>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      specialties: '',
      isActive: true,
    }
  });

  // Options for target barber select
  const targetBarberOptions = useMemo(() => {
    if (!barberToDeactivate) return [];
    return barbers
      .filter((b) => b.id !== barberToDeactivate.id && b.isActive)
      .map((b) => ({ value: b.id, label: b.name }));
  }, [barbers, barberToDeactivate]);

  const fetchBarbers = async () => {
    try {
      const response = await barbersApi.getAll();
      setBarbers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar barbeiros');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBarbers(); }, []);

  const openModal = (barber?: Barber) => {
    if (barber) {
      setEditingBarber(barber);
      reset({
        name: barber.name,
        phone: barber.phone || '',
        email: barber.email || '',
        specialties: barber.specialties.join(', '),
        isActive: barber.isActive,
      });
    } else {
      setEditingBarber(null);
      reset({ name: '', phone: '', email: '', specialties: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBarber(null);
    reset();
  };

  const onSubmit = async (data: BarberFormData) => {
    const payload = {
      ...data,
      specialties: data.specialties.split(',').map((s: string) => s.trim()).filter(Boolean),
    };

    try {
      if (editingBarber) {
        await barbersApi.update(editingBarber.id, payload);
        toast.success('Barbeiro atualizado!');
      } else {
        await barbersApi.create(payload);
        toast.success('Barbeiro criado!');
      }
      closeModal();
      fetchBarbers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar');
    }
  };

  const handleDelete = async (barber: Barber) => {
    try {
      const response = await barbersApi.getPendingAppointments(barber.id);
      const { appointments, subscriptions } = response.data;

      if (appointments.length > 0 || subscriptions.length > 0) {
        setBarberToDeactivate(barber);
        setPendingAppointments(appointments);
        setActiveSubscriptions(subscriptions);
        setDeactivateAction('cancel');
        setTargetBarberId('');
        setIsDeactivateModalOpen(true);
      } else {
        setBarberToDeactivate(barber);
        setIsDeactivateModalOpen(true);
      }
    } catch (error) {
      toast.error('Erro ao verificar agendamentos');
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!barberToDeactivate) return;

    if (deactivateAction === 'transfer' && !targetBarberId && (pendingAppointments.length > 0 || activeSubscriptions.length > 0)) {
      toast.error('Selecione o barbeiro de destino');
      return;
    }

    setIsDeactivating(true);
    try {
      if (pendingAppointments.length > 0 || activeSubscriptions.length > 0) {
        const response = await barbersApi.deactivateWithAction(
          barberToDeactivate.id,
          deactivateAction,
          deactivateAction === 'transfer' ? targetBarberId : undefined
        );

        const result = response.data;
        const parts: string[] = [];

        if (result.appointmentsAffected > 0) {
          parts.push(`${result.appointmentsAffected} agendamento(s)`);
        }
        if (result.subscriptionsAffected > 0) {
          parts.push(`${result.subscriptionsAffected} assinatura(s)`);
        }

        if (deactivateAction === 'transfer') {
          const msg = parts.length > 0
            ? `Barbeiro desativado! ${parts.join(' e ')} transferido(s).`
            : 'Barbeiro desativado!';
          toast.success(msg);
        } else {
          const msg = parts.length > 0
            ? `Barbeiro desativado! ${parts.join(' e ')} cancelado(s).`
            : 'Barbeiro desativado!';
          toast.success(msg);
        }
      } else {
        await barbersApi.delete(barberToDeactivate.id);
        toast.success('Barbeiro desativado!');
      }

      setIsDeactivateModalOpen(false);
      setBarberToDeactivate(null);
      setPendingAppointments([]);
      setActiveSubscriptions([]);
      fetchBarbers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao desativar barbeiro');
    } finally {
      setIsDeactivating(false);
    }
  };

  const viewStats = async (barber: Barber) => {
    try {
      const response = await barbersApi.getDashboard(barber.id);
      setSelectedBarberStats({ ...response.data, barberName: barber.name });
      setIsStatsModalOpen(true);
    } catch (error) {
      toast.error('Erro ao carregar estatísticas');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <PageTransition>
      <Header title="Barbeiros" subtitle={`${barbers.length} barbeiros`} />

      <div className="p-8">
        <FadeIn>
          <div className="flex justify-end mb-6">
            <Button
              onClick={() => openModal()}
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              Novo Barbeiro
            </Button>
          </div>
        </FadeIn>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : barbers.length === 0 ? (
          <FadeIn delay={0.1}>
            <EmptyState
              icon={<ScissorsIcon className="w-16 h-16" />}
              title="Nenhum barbeiro cadastrado"
              action={<Button onClick={() => openModal()}>Cadastrar</Button>}
            />
          </FadeIn>
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbers.map((barber) => (
              <StaggerItem key={barber.id}>
                <Card hoverable className="h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{barber.name}</h3>
                      <p className="text-dark-400 text-sm">{barber.phone}</p>
                    </div>
                    <Badge variant={barber.isActive ? 'success' : 'neutral'}>
                      {barber.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  {barber.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {barber.specialties.map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-dark-800 rounded text-sm text-dark-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-4 border-t border-dark-700">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => viewStats(barber)}
                      leftIcon={<ChartBarIcon className="w-4 h-4" />}
                    >
                      Estatísticas
                    </Button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openModal(barber)}
                      className="p-2 text-dark-400 hover:text-primary-500 hover:bg-dark-700 rounded-lg transition-colors"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(barber)}
                      className="p-2 text-dark-400 hover:text-red-500 hover:bg-dark-700 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </motion.button>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingBarber ? 'Editar Barbeiro' : 'Novo Barbeiro'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Nome */}
          <Input
            label="Nome completo"
            placeholder="Nome do barbeiro"
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
              render={({ field }) => (
                <PhoneInput
                  label="Telefone"
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="(34) 99876-5432"
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

          {/* Especialidades */}
          <Input
            label="Especialidades"
            placeholder="Corte, Barba, Degradê (separadas por vírgula)"
            helperText="Digite as especialidades separadas por vírgula"
            {...register('specialties')}
          />

          {/* Status */}
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Switch
                label="Barbeiro ativo"
                description="Barbeiros inativos não aparecem para agendamento"
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingBarber ? 'Atualizar' : 'Criar Barbeiro'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stats Modal */}
      <Modal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} title={`Estatísticas - ${selectedBarberStats?.barberName || 'Barbeiro'}`} size="lg">
        {selectedBarberStats && (
          <div className="space-y-6">
            <StaggerContainer className="grid grid-cols-3 gap-4">
              <StaggerItem>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-dark-800 p-4 rounded-lg text-center border border-dark-700 hover:border-green-500/30 transition-colors"
                >
                  <p className="text-dark-400 text-sm mb-1">Receita Total</p>
                  <AnimatedCurrency
                    value={selectedBarberStats.stats.totalRevenue}
                    className="text-2xl font-bold text-green-500"
                  />
                </motion.div>
              </StaggerItem>
              <StaggerItem>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-dark-800 p-4 rounded-lg text-center border border-dark-700 hover:border-primary-500/30 transition-colors"
                >
                  <p className="text-dark-400 text-sm mb-1">Atendimentos</p>
                  <AnimatedNumber
                    value={selectedBarberStats.stats.totalAppointments}
                    className="text-2xl font-bold text-primary-500"
                  />
                </motion.div>
              </StaggerItem>
              <StaggerItem>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-dark-800 p-4 rounded-lg text-center border border-dark-700 hover:border-blue-500/30 transition-colors"
                >
                  <p className="text-dark-400 text-sm mb-1">Ticket Médio</p>
                  <AnimatedCurrency
                    value={selectedBarberStats.stats.averageTicket}
                    className="text-2xl font-bold text-blue-500"
                  />
                </motion.div>
              </StaggerItem>
            </StaggerContainer>

            <div>
              <h4 className="text-white font-semibold mb-3">Serviços Mais Realizados</h4>
              <div className="space-y-2">
                {selectedBarberStats.topServices.map((s: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex justify-between items-center bg-dark-800 p-3 rounded-lg hover:bg-dark-800/80 transition-colors"
                  >
                    <span className="text-white">{s.name}</span>
                    <div className="text-right">
                      <span className="text-dark-400">{s.count}x</span>
                      <span className="text-green-500 ml-4">{formatCurrency(s.revenue)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Deactivate Modal */}
      <Modal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        title="Desativar Barbeiro"
        size="lg"
      >
        {barberToDeactivate && (
          <div className="space-y-6">
            {/* Warning */}
            {(pendingAppointments.length > 0 || activeSubscriptions.length > 0) && (
              <FadeIn>
                <div className="flex items-start gap-3 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">
                      {barberToDeactivate.name} possui:
                    </p>
                    <ul className="text-dark-300 text-sm mt-1 list-disc list-inside">
                      {pendingAppointments.length > 0 && (
                        <li>{pendingAppointments.length} agendamento(s) pendente(s)</li>
                      )}
                      {activeSubscriptions.length > 0 && (
                        <li>{activeSubscriptions.length} assinatura(s) ativa(s)</li>
                      )}
                    </ul>
                    <p className="text-dark-400 text-sm mt-2">
                      Escolha o que fazer antes de desativar o barbeiro.
                    </p>
                  </div>
                </div>
              </FadeIn>
            )}

            {/* No pending items message */}
            {pendingAppointments.length === 0 && activeSubscriptions.length === 0 && (
              <FadeIn>
                <p className="text-dark-300">
                  Deseja realmente desativar <span className="text-white font-medium">{barberToDeactivate.name}</span>?
                </p>
              </FadeIn>
            )}

            {/* Pending Appointments List */}
            {pendingAppointments.length > 0 && (
              <div>
                <p className="text-dark-300 text-sm font-medium mb-2">Agendamentos pendentes:</p>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {pendingAppointments.map((apt: any, index) => (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex justify-between items-center p-3 bg-dark-800 rounded-lg"
                    >
                      <div>
                        <p className="text-white">{apt.client?.name}</p>
                        <p className="text-dark-400 text-sm">{apt.service?.name}</p>
                      </div>
                      <p className="text-dark-300 text-sm">
                        {format(new Date(apt.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Subscriptions List */}
            {activeSubscriptions.length > 0 && (
              <div>
                <p className="text-dark-300 text-sm font-medium mb-2">Assinaturas ativas:</p>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {activeSubscriptions.map((sub: any, index) => (
                    <motion.div
                      key={sub.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex justify-between items-center p-3 bg-dark-800 rounded-lg"
                    >
                      <div>
                        <p className="text-white">{sub.client?.name}</p>
                        <p className="text-dark-400 text-sm">
                          {sub.package?.name || sub.service?.name || 'Assinatura'}
                        </p>
                      </div>
                      <Badge variant={sub.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                        {sub.status === 'ACTIVE' ? 'Ativa' : 'Pausada'}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Selection */}
            {(pendingAppointments.length > 0 || activeSubscriptions.length > 0) && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-dark-300">
                  O que deseja fazer?
                </label>

                <RadioGroup
                  name="deactivateAction"
                  value={deactivateAction}
                  onChange={(value) => setDeactivateAction(value as 'cancel' | 'transfer')}
                  options={deactivateActionOptions}
                  direction="vertical"
                />

                {deactivateAction === 'transfer' && targetBarberOptions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-7"
                  >
                    <SearchableSelect
                      label="Transferir para"
                      value={targetBarberId}
                      onChange={(value) => setTargetBarberId(value || '')}
                      options={targetBarberOptions}
                      placeholder="Selecione o barbeiro de destino"
                      required
                    />
                  </motion.div>
                )}

                {deactivateAction === 'transfer' && targetBarberOptions.length === 0 && (
                  <p className="text-yellow-500 text-sm ml-7">
                    Não há outros barbeiros ativos para transferir.
                  </p>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
              <Button
                variant="secondary"
                onClick={() => setIsDeactivateModalOpen(false)}
                disabled={isDeactivating}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDeactivate}
                disabled={isDeactivating || (deactivateAction === 'transfer' && !targetBarberId && (pendingAppointments.length > 0 || activeSubscriptions.length > 0))}
                isLoading={isDeactivating}
              >
                Desativar Barbeiro
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
