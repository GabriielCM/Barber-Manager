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
  CardSkeleton,
  ConfirmDialog,
  Modal,
  SearchableSelect,
  DatePicker,
  TimePicker,
  Drawer,
} from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { appointmentsApi, clientsApi, barbersApi, servicesApi } from '@/lib/api';
import { Appointment, Client, Barber, Service } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  CalendarDaysIcon,
  PlayIcon,
  XMarkIcon,
  CheckIcon,
  UserIcon,
  ClockIcon,
  PhoneIcon,
  ScissorsIcon,
  EyeIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftEllipsisIcon,
  CalendarIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { format, parse, parseISO, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface AppointmentFormData {
  clientId: string;
  barberId: string;
  serviceId: string;
  date: Date | null;
  time: string;
  notes: string;
}

interface RescheduleFormData {
  date: Date | null;
  time: string;
  barberId: string;
}

// ============================================
// STATUS CONFIG
// ============================================
const statusConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; label: string; bgColor: string; borderColor: string }> = {
  SCHEDULED: { variant: 'info', label: 'Agendado', bgColor: 'bg-blue-500/10', borderColor: 'border-l-blue-500' },
  IN_PROGRESS: { variant: 'warning', label: 'Em andamento', bgColor: 'bg-yellow-500/10', borderColor: 'border-l-yellow-500' },
  COMPLETED: { variant: 'success', label: 'Concluido', bgColor: 'bg-green-500/10', borderColor: 'border-l-green-500' },
  CANCELLED: { variant: 'danger', label: 'Cancelado', bgColor: 'bg-red-500/10', borderColor: 'border-l-red-500' },
  NO_SHOW: { variant: 'neutral', label: 'Nao compareceu', bgColor: 'bg-gray-500/10', borderColor: 'border-l-gray-500' },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
function getAppointmentPrice(appointment: Appointment): number {
  // Se tem servico individual com preco, usar
  if (appointment.service?.price && Number(appointment.service.price) > 0) {
    return Number(appointment.service.price);
  }

  // Se e baseado em assinatura com pacote, usar o preco final do pacote
  if (appointment.isSubscriptionBased && appointment.subscription?.package) {
    return Number(appointment.subscription.package.finalPrice || 0);
  }

  // Se tem servicos do pacote (appointmentServices), somar os precos
  if (appointment.appointmentServices && appointment.appointmentServices.length > 0) {
    return appointment.appointmentServices.reduce(
      (total, as) => total + Number(as.service?.price || 0),
      0
    );
  }

  return 0;
}

function getAppointmentDuration(appointment: Appointment): number {
  // Se tem servico individual, usar duracao dele
  if (appointment.service?.duration) {
    return appointment.service.duration;
  }

  // Se tem servicos do pacote, somar as duracoes
  if (appointment.appointmentServices && appointment.appointmentServices.length > 0) {
    return appointment.appointmentServices.reduce(
      (total, as) => total + (as.service?.duration || 0),
      0
    );
  }

  // Se e assinatura com pacote, somar duracoes dos servicos do pacote
  if (appointment.subscription?.package?.services) {
    return appointment.subscription.package.services.reduce(
      (total, ps) => total + (ps.service?.duration || 0),
      0
    );
  }

  return 30; // Fallback
}

function getAppointmentServiceName(appointment: Appointment): string {
  // Se tem servico individual
  if (appointment.service?.name) {
    return appointment.service.name;
  }

  // Se e assinatura com pacote
  if (appointment.isSubscriptionBased && appointment.subscription?.package?.name) {
    return appointment.subscription.package.name;
  }

  // Se tem servicos do pacote
  if (appointment.appointmentServices && appointment.appointmentServices.length > 0) {
    if (appointment.appointmentServices.length === 1) {
      return appointment.appointmentServices[0].service?.name || 'Servico';
    }
    return `${appointment.appointmentServices.length} servicos`;
  }

  return 'Pacote';
}

// ============================================
// APPOINTMENT CARD COMPONENT
// ============================================
interface AppointmentCardProps {
  appointment: Appointment;
  onStart: (id: string) => void;
  onCancel: (appointment: Appointment) => void;
  onNoShow: (appointment: Appointment) => void;
  onViewDetails: (appointment: Appointment) => void;
  onReschedule: (appointment: Appointment) => void;
}

function AppointmentCard({ appointment, onStart, onCancel, onNoShow, onViewDetails, onReschedule }: AppointmentCardProps) {
  const status = statusConfig[appointment.status] || statusConfig.SCHEDULED;
  const startTime = format(new Date(appointment.date), 'HH:mm');
  const duration = getAppointmentDuration(appointment);
  const endTime = format(addMinutes(new Date(appointment.date), duration), 'HH:mm');
  const price = getAppointmentPrice(appointment);
  const serviceName = getAppointmentServiceName(appointment);
  const isPackage = appointment.isSubscriptionBased || (appointment.appointmentServices && appointment.appointmentServices.length > 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.01 }}
      className={`
        relative overflow-hidden rounded-xl border border-dark-800
        ${status.bgColor} border-l-4 ${status.borderColor}
        transition-all duration-200 hover:border-dark-700 hover:shadow-lg
      `}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar/Initials */}
            <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
              <span className="text-primary-400 font-bold text-lg">
                {appointment.client?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">
                {appointment.client?.name || 'Cliente'}
              </h3>
              <div className="flex items-center gap-2 text-dark-400 text-sm">
                <PhoneIcon className="w-3.5 h-3.5" />
                <span>{appointment.client?.phone || '-'}</span>
              </div>
            </div>
          </div>
          <Badge variant={status.variant} dot>
            {status.label}
          </Badge>
        </div>

        {/* Service & Barber Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-dark-800/50">
              <ScissorsIcon className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <p className="text-xs text-dark-500">{isPackage ? 'Pacote' : 'Servico'}</p>
              <p className="text-sm text-white font-medium">{serviceName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-dark-800/50">
              <UserIcon className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Barbeiro</p>
              <p className="text-sm text-white font-medium">{appointment.barber?.name || '-'}</p>
            </div>
          </div>
        </div>

        {/* Time & Price Row */}
        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-dark-900/50 mb-4">
          <div className="flex items-center gap-3">
            <ClockIcon className="w-5 h-5 text-primary-500" />
            <div>
              <p className="text-2xl font-bold text-white">{startTime}</p>
              <p className="text-xs text-dark-400">ate {endTime} ({duration} min)</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-dark-500">Valor</p>
            <p className="text-lg font-bold text-green-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}
            </p>
          </div>
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-dark-800/30">
            <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-dark-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-dark-300">{appointment.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-dark-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(appointment)}
            leftIcon={<EyeIcon className="w-4 h-4" />}
          >
            Detalhes
          </Button>

          {appointment.status === 'SCHEDULED' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReschedule(appointment)}
                leftIcon={<ArrowPathIcon className="w-4 h-4" />}
              >
                Reagendar
              </Button>
              <div className="flex-1" />
              <Button
                variant="success"
                size="sm"
                onClick={() => onStart(appointment.id)}
                leftIcon={<PlayIcon className="w-4 h-4" />}
              >
                Iniciar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNoShow(appointment)}
              >
                Nao veio
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onCancel(appointment)}
                leftIcon={<XMarkIcon className="w-4 h-4" />}
              >
                Cancelar
              </Button>
            </>
          )}

          {appointment.status === 'IN_PROGRESS' && !appointment.checkout && (
            <>
              <div className="flex-1" />
              <a href={`/dashboard/checkout?appointmentId=${appointment.id}`}>
                <Button
                  leftIcon={<CheckIcon className="w-4 h-4" />}
                >
                  Finalizar
                </Button>
              </a>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// APPOINTMENT DETAILS DRAWER
// ============================================
interface AppointmentDetailsDrawerProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onReschedule: () => void;
}

function AppointmentDetailsDrawer({ appointment, isOpen, onClose, onReschedule }: AppointmentDetailsDrawerProps) {
  if (!appointment) return null;

  const status = statusConfig[appointment.status] || statusConfig.SCHEDULED;
  const duration = getAppointmentDuration(appointment);
  const price = getAppointmentPrice(appointment);
  const serviceName = getAppointmentServiceName(appointment);
  const isPackage = appointment.isSubscriptionBased || (appointment.appointmentServices && appointment.appointmentServices.length > 0);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Detalhes do Agendamento" size="lg">
      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex justify-between items-center">
          <Badge variant={status.variant} dot size="lg">
            {status.label}
          </Badge>
          {appointment.status === 'SCHEDULED' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onReschedule}
              leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            >
              Reagendar
            </Button>
          )}
        </div>

        {/* Client Info */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center">
              <span className="text-primary-400 font-bold text-2xl">
                {appointment.client?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{appointment.client?.name}</h3>
              <div className="flex items-center gap-4 mt-1 text-dark-400">
                <span className="flex items-center gap-1">
                  <PhoneIcon className="w-4 h-4" />
                  {appointment.client?.phone}
                </span>
                {appointment.client?.email && (
                  <span>{appointment.client.email}</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Appointment Details */}
        <Card>
          <h4 className="text-lg font-semibold text-white mb-4">Informacoes do Agendamento</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-dark-500 uppercase tracking-wide">Data</p>
              <p className="text-white font-medium flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary-400" />
                {format(new Date(appointment.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-dark-500 uppercase tracking-wide">Horario</p>
              <p className="text-white font-medium flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-primary-400" />
                {format(new Date(appointment.date), 'HH:mm')} - {format(addMinutes(new Date(appointment.date), duration), 'HH:mm')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-dark-500 uppercase tracking-wide">{isPackage ? 'Pacote' : 'Servico'}</p>
              <p className="text-white font-medium flex items-center gap-2">
                <ScissorsIcon className="w-4 h-4 text-primary-400" />
                {serviceName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-dark-500 uppercase tracking-wide">Barbeiro</p>
              <p className="text-white font-medium flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-primary-400" />
                {appointment.barber?.name}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-dark-500 uppercase tracking-wide">Duracao</p>
              <p className="text-white font-medium">{duration} minutos</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-dark-500 uppercase tracking-wide">Valor</p>
              <p className="text-green-400 font-bold text-lg">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}
              </p>
            </div>
          </div>
        </Card>

        {/* Notes */}
        {appointment.notes && (
          <Card>
            <h4 className="text-lg font-semibold text-white mb-3">Observacoes</h4>
            <p className="text-dark-300">{appointment.notes}</p>
          </Card>
        )}

        {/* Subscription Info */}
        {appointment.isSubscriptionBased && appointment.subscription && (
          <Card className="border-primary-500/30 bg-primary-500/5">
            <h4 className="text-lg font-semibold text-primary-400 mb-3">Agendamento de Assinatura</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-dark-500 uppercase tracking-wide">Pacote</p>
                <p className="text-white font-medium">{appointment.subscription.package?.name || 'Assinatura'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-dark-500 uppercase tracking-wide">Sessao</p>
                <p className="text-white font-medium">
                  {(appointment.subscriptionSlotIndex || 0) + 1} de {appointment.subscription.totalSlots}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Checkout Info if completed */}
        {appointment.checkout && (
          <Card className="border-green-500/30 bg-green-500/5">
            <h4 className="text-lg font-semibold text-green-400 mb-3">Checkout Realizado</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-dark-500 uppercase tracking-wide">Subtotal</p>
                <p className="text-white font-medium">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(appointment.checkout.subtotal))}
                </p>
              </div>
              {Number(appointment.checkout.discount) > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-dark-500 uppercase tracking-wide">Desconto</p>
                  <p className="text-red-400 font-medium">
                    -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(appointment.checkout.discount))}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-dark-500 uppercase tracking-wide">Total Pago</p>
                <p className="text-green-400 font-bold text-lg">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(appointment.checkout.total))}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-dark-500 uppercase tracking-wide">Forma de Pagamento</p>
                <p className="text-white font-medium">{appointment.checkout.paymentMethod}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Created At */}
        <p className="text-xs text-dark-500 text-center">
          Criado em {format(new Date(appointment.createdAt), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
        </p>
      </div>
    </Drawer>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [cancelDialog, setCancelDialog] = useState<{ isOpen: boolean; appointment: Appointment | null }>({
    isOpen: false,
    appointment: null,
  });
  const [noShowDialog, setNoShowDialog] = useState<{ isOpen: boolean; appointment: Appointment | null }>({
    isOpen: false,
    appointment: null,
  });

  // Create form
  const { register, handleSubmit, reset, control, watch, formState: { errors, isSubmitting } } = useForm<AppointmentFormData>({
    defaultValues: {
      clientId: '',
      barberId: '',
      serviceId: '',
      date: new Date(),
      time: '09:00',
      notes: '',
    }
  });

  // Reschedule form
  const rescheduleForm = useForm<RescheduleFormData>({
    defaultValues: {
      date: new Date(),
      time: '09:00',
      barberId: '',
    }
  });

  // SelectOptions
  const clientOptions: SelectOption<string>[] = useMemo(
    () => clients.map((c) => ({
      value: c.id,
      label: c.name,
      description: c.phone,
    })),
    [clients]
  );

  const barberOptions: SelectOption<string>[] = useMemo(
    () => barbers.map((b) => ({
      value: b.id,
      label: b.name,
      description: b.specialties?.join(', ') || '',
    })),
    [barbers]
  );

  const serviceOptions: SelectOption<string>[] = useMemo(
    () => services.map((s) => ({
      value: s.id,
      label: s.name,
      description: `R$ ${Number(s.price).toFixed(2)} | ${s.duration} min`,
    })),
    [services]
  );

  // Get selected service for duration display
  const watchServiceId = watch('serviceId');
  const selectedService = useMemo(
    () => services.find((s) => s.id === watchServiceId),
    [services, watchServiceId]
  );

  // Filter appointments by status
  const filteredAppointments = useMemo(() => {
    if (statusFilter === 'all') return appointments;
    return appointments.filter(apt => apt.status === statusFilter);
  }, [appointments, statusFilter]);

  // Group appointments by status for stats
  const stats = useMemo(() => {
    const scheduled = appointments.filter(a => a.status === 'SCHEDULED').length;
    const inProgress = appointments.filter(a => a.status === 'IN_PROGRESS').length;
    const completed = appointments.filter(a => a.status === 'COMPLETED').length;
    const cancelled = appointments.filter(a => a.status === 'CANCELLED').length;
    const noShow = appointments.filter(a => a.status === 'NO_SHOW').length;
    return { scheduled, inProgress, completed, cancelled, noShow, total: appointments.length };
  }, [appointments]);

  const fetchData = async () => {
    try {
      const [appointmentsRes, clientsRes, barbersRes, servicesRes] = await Promise.all([
        appointmentsApi.getAll({ date: selectedDate }),
        clientsApi.getAll({ status: 'ACTIVE' }),
        barbersApi.getAll(true),
        servicesApi.getAll(true),
      ]);
      setAppointments(appointmentsRes.data.appointments);
      setClients(clientsRes.data.clients);
      setBarbers(barbersRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedDate]);

  const openModal = () => {
    reset({
      clientId: '',
      barberId: '',
      serviceId: '',
      date: parseISO(selectedDate),
      time: '09:00',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); reset(); };

  const onSubmit = async (data: AppointmentFormData) => {
    if (!data.date) {
      toast.error('Data e obrigatoria');
      return;
    }

    const dateStr = format(data.date, 'yyyy-MM-dd');
    const dateTime = new Date(`${dateStr}T${data.time}:00`);

    try {
      await appointmentsApi.create({
        clientId: data.clientId,
        barberId: data.barberId,
        serviceId: data.serviceId,
        date: dateTime.toISOString(),
        notes: data.notes,
      });
      toast.success('Agendamento criado!');
      closeModal();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar agendamento');
    }
  };

  const handleStart = async (id: string) => {
    try {
      await appointmentsApi.start(id);
      toast.success('Atendimento iniciado!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao iniciar atendimento');
    }
  };

  const openCancelDialog = (appointment: Appointment) => {
    setCancelDialog({ isOpen: true, appointment });
  };

  const handleCancel = async () => {
    if (!cancelDialog.appointment) return;
    try {
      await appointmentsApi.cancel(cancelDialog.appointment.id);
      toast.success('Agendamento cancelado!');
      fetchData();
      setCancelDialog({ isOpen: false, appointment: null });
    } catch (error) {
      toast.error('Erro ao cancelar');
    }
  };

  const openNoShowDialog = (appointment: Appointment) => {
    setNoShowDialog({ isOpen: true, appointment });
  };

  const handleNoShow = async () => {
    if (!noShowDialog.appointment) return;
    try {
      await appointmentsApi.update(noShowDialog.appointment.id, { status: 'NO_SHOW' });
      toast.success('Marcado como nao compareceu');
      fetchData();
      setNoShowDialog({ isOpen: false, appointment: null });
    } catch (error) {
      toast.error('Erro');
    }
  };

  const openDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  const openReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(false);
    rescheduleForm.reset({
      date: new Date(appointment.date),
      time: format(new Date(appointment.date), 'HH:mm'),
      barberId: appointment.barberId,
    });
    setIsRescheduleModalOpen(true);
  };

  const handleReschedule = async (data: RescheduleFormData) => {
    if (!selectedAppointment || !data.date) return;

    const dateStr = format(data.date, 'yyyy-MM-dd');
    const dateTime = new Date(`${dateStr}T${data.time}:00`);

    try {
      await appointmentsApi.update(selectedAppointment.id, {
        date: dateTime.toISOString(),
        barberId: data.barberId,
      });
      toast.success('Agendamento reagendado com sucesso!');
      setIsRescheduleModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao reagendar');
    }
  };

  return (
    <PageTransition>
      <Header
        title="Agendamentos"
        subtitle={format(new Date(selectedDate + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
      />

      <div className="p-8">
        {/* Stats Cards */}
        <FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <button
              onClick={() => setStatusFilter('all')}
              className={`p-4 rounded-xl border transition-all ${statusFilter === 'all' ? 'border-primary-500 bg-primary-500/10' : 'border-dark-800 bg-dark-900 hover:border-dark-700'}`}
            >
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-dark-400">Total</p>
            </button>
            <button
              onClick={() => setStatusFilter('SCHEDULED')}
              className={`p-4 rounded-xl border transition-all ${statusFilter === 'SCHEDULED' ? 'border-blue-500 bg-blue-500/10' : 'border-dark-800 bg-dark-900 hover:border-dark-700'}`}
            >
              <p className="text-2xl font-bold text-blue-400">{stats.scheduled}</p>
              <p className="text-sm text-dark-400">Agendados</p>
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`p-4 rounded-xl border transition-all ${statusFilter === 'IN_PROGRESS' ? 'border-yellow-500 bg-yellow-500/10' : 'border-dark-800 bg-dark-900 hover:border-dark-700'}`}
            >
              <p className="text-2xl font-bold text-yellow-400">{stats.inProgress}</p>
              <p className="text-sm text-dark-400">Em andamento</p>
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`p-4 rounded-xl border transition-all ${statusFilter === 'COMPLETED' ? 'border-green-500 bg-green-500/10' : 'border-dark-800 bg-dark-900 hover:border-dark-700'}`}
            >
              <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
              <p className="text-sm text-dark-400">Concluidos</p>
            </button>
            <button
              onClick={() => setStatusFilter('CANCELLED')}
              className={`p-4 rounded-xl border transition-all ${statusFilter === 'CANCELLED' ? 'border-red-500 bg-red-500/10' : 'border-dark-800 bg-dark-900 hover:border-dark-700'}`}
            >
              <p className="text-2xl font-bold text-red-400">{stats.cancelled + stats.noShow}</p>
              <p className="text-sm text-dark-400">Cancelados</p>
            </button>
          </div>
        </FadeIn>

        {/* Controls */}
        <FadeIn delay={0.1}>
          <div className="flex items-center justify-between mb-6">
            <DatePicker
              value={parseISO(selectedDate)}
              onChange={(date) => date && setSelectedDate(format(date, 'yyyy-MM-dd'))}
              placeholder="Selecione a data"
            />
            <Button
              onClick={openModal}
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              Novo Agendamento
            </Button>
          </div>
        </FadeIn>

        {/* Appointments Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <FadeIn delay={0.1}>
            <EmptyState
              icon={<CalendarDaysIcon className="w-16 h-16" />}
              title={statusFilter === 'all' ? "Nenhum agendamento para esta data" : `Nenhum agendamento ${statusConfig[statusFilter]?.label.toLowerCase() || ''}`}
              action={<Button onClick={openModal}>Agendar</Button>}
            />
          </FadeIn>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredAppointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onStart={handleStart}
                  onCancel={openCancelDialog}
                  onNoShow={openNoShowDialog}
                  onViewDetails={openDetails}
                  onReschedule={openReschedule}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Novo Agendamento" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Cliente */}
          <Controller
            name="clientId"
            control={control}
            rules={{ required: 'Cliente e obrigatorio' }}
            render={({ field }) => (
              <SearchableSelect
                label="Cliente"
                value={field.value}
                onChange={field.onChange}
                options={clientOptions}
                placeholder="Buscar cliente por nome ou telefone..."
                searchPlaceholder="Digite para buscar..."
                error={errors.clientId?.message as string}
                required
              />
            )}
          />

          {/* Barbeiro e Servico em grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="barberId"
              control={control}
              rules={{ required: 'Barbeiro e obrigatorio' }}
              render={({ field }) => (
                <SearchableSelect
                  label="Barbeiro"
                  value={field.value}
                  onChange={field.onChange}
                  options={barberOptions}
                  placeholder="Selecione o barbeiro"
                  error={errors.barberId?.message as string}
                  required
                />
              )}
            />

            <Controller
              name="serviceId"
              control={control}
              rules={{ required: 'Servico e obrigatorio' }}
              render={({ field }) => (
                <SearchableSelect
                  label="Servico"
                  value={field.value}
                  onChange={field.onChange}
                  options={serviceOptions}
                  placeholder="Selecione o servico"
                  error={errors.serviceId?.message as string}
                  required
                />
              )}
            />
          </div>

          {/* Service info preview */}
          {selectedService && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-dark-800 rounded-lg border border-dark-700"
            >
              <div className="flex justify-between items-center text-sm">
                <span className="text-dark-400">Duracao estimada:</span>
                <span className="font-medium text-white">{selectedService.duration} minutos</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-dark-400">Valor:</span>
                <span className="font-medium text-green-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(selectedService.price))}
                </span>
              </div>
            </motion.div>
          )}

          {/* Data e Horario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="date"
              control={control}
              rules={{ required: 'Data e obrigatoria' }}
              render={({ field }) => (
                <DatePicker
                  label="Data"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecione a data"
                  minDate={new Date()}
                  error={errors.date?.message as string}
                  required
                />
              )}
            />

            <Controller
              name="time"
              control={control}
              rules={{ required: 'Horario e obrigatorio' }}
              render={({ field }) => (
                <TimePicker
                  label="Horario"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecione o horario"
                  error={errors.time?.message as string}
                  required
                />
              )}
            />
          </div>

          {/* Observacoes */}
          <Textarea
            label="Observacoes"
            placeholder="Observacoes sobre o agendamento..."
            {...register('notes')}
            rows={2}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Criar Agendamento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal isOpen={isRescheduleModalOpen} onClose={() => setIsRescheduleModalOpen(false)} title="Reagendar Agendamento" size="md">
        <form onSubmit={rescheduleForm.handleSubmit(handleReschedule)} className="space-y-5">
          {selectedAppointment && (
            <div className="p-4 bg-dark-800 rounded-lg border border-dark-700 mb-4">
              <p className="text-sm text-dark-400">Agendamento atual</p>
              <p className="text-white font-medium">{selectedAppointment.client?.name}</p>
              <p className="text-dark-400 text-sm">{selectedAppointment.service?.name} com {selectedAppointment.barber?.name}</p>
              <p className="text-primary-400 text-sm mt-1">
                {format(new Date(selectedAppointment.date), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
              </p>
            </div>
          )}

          <Controller
            name="barberId"
            control={rescheduleForm.control}
            rules={{ required: 'Barbeiro e obrigatorio' }}
            render={({ field }) => (
              <SearchableSelect
                label="Barbeiro"
                value={field.value}
                onChange={field.onChange}
                options={barberOptions}
                placeholder="Selecione o barbeiro"
                error={rescheduleForm.formState.errors.barberId?.message as string}
                required
              />
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="date"
              control={rescheduleForm.control}
              rules={{ required: 'Data e obrigatoria' }}
              render={({ field }) => (
                <DatePicker
                  label="Nova Data"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecione a data"
                  minDate={new Date()}
                  error={rescheduleForm.formState.errors.date?.message as string}
                  required
                />
              )}
            />

            <Controller
              name="time"
              control={rescheduleForm.control}
              rules={{ required: 'Horario e obrigatorio' }}
              render={({ field }) => (
                <TimePicker
                  label="Novo Horario"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecione o horario"
                  error={rescheduleForm.formState.errors.time?.message as string}
                  required
                />
              )}
            />
          </div>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              O sistema verificara automaticamente se ha conflito de horarios com outros agendamentos do barbeiro.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <Button type="button" variant="secondary" onClick={() => setIsRescheduleModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={rescheduleForm.formState.isSubmitting}>
              Confirmar Reagendamento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Details Drawer */}
      <AppointmentDetailsDrawer
        appointment={selectedAppointment}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onReschedule={() => {
          setIsDetailsOpen(false);
          if (selectedAppointment) openReschedule(selectedAppointment);
        }}
      />

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={cancelDialog.isOpen}
        onClose={() => setCancelDialog({ isOpen: false, appointment: null })}
        onConfirm={handleCancel}
        title="Cancelar Agendamento"
        message={`Tem certeza que deseja cancelar o agendamento de ${cancelDialog.appointment?.client?.name}?`}
        variant="danger"
        confirmText="Cancelar Agendamento"
      />

      {/* No Show Confirmation */}
      <ConfirmDialog
        isOpen={noShowDialog.isOpen}
        onClose={() => setNoShowDialog({ isOpen: false, appointment: null })}
        onConfirm={handleNoShow}
        title="Cliente Nao Compareceu"
        message={`Marcar ${noShowDialog.appointment?.client?.name} como nao compareceu?`}
        variant="warning"
        confirmText="Confirmar"
      />
    </PageTransition>
  );
}
