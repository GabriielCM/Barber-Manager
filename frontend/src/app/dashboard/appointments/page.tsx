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
  ScissorsIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { format, parse, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface AppointmentFormData {
  clientId: string;
  barberId: string;
  serviceId: string;
  date: Date | null;
  time: string;
  notes: string;
}

// ============================================
// STATUS CONFIG
// ============================================
const statusConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; label: string }> = {
  SCHEDULED: { variant: 'info', label: 'Agendado' },
  IN_PROGRESS: { variant: 'warning', label: 'Em andamento' },
  COMPLETED: { variant: 'success', label: 'Concluído' },
  CANCELLED: { variant: 'danger', label: 'Cancelado' },
  NO_SHOW: { variant: 'neutral', label: 'Não compareceu' },
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [cancelDialog, setCancelDialog] = useState<{ isOpen: boolean; appointment: Appointment | null }>({
    isOpen: false,
    appointment: null,
  });
  const [noShowDialog, setNoShowDialog] = useState<{ isOpen: boolean; appointment: Appointment | null }>({
    isOpen: false,
    appointment: null,
  });

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
      toast.error('Data é obrigatória');
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
      toast.success('Marcado como não compareceu');
      fetchData();
      setNoShowDialog({ isOpen: false, appointment: null });
    } catch (error) {
      toast.error('Erro');
    }
  };

  return (
    <PageTransition>
      <Header
        title="Agendamentos"
        subtitle={format(new Date(selectedDate + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
      />

      <div className="p-8">
        <FadeIn>
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

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <FadeIn delay={0.1}>
            <EmptyState
              icon={<CalendarDaysIcon className="w-16 h-16" />}
              title="Nenhum agendamento para esta data"
              action={<Button onClick={openModal}>Agendar</Button>}
            />
          </FadeIn>
        ) : (
          <StaggerContainer className="space-y-4">
            {appointments.map((apt) => (
              <StaggerItem key={apt.id}>
                <Card hoverable className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="text-center min-w-[70px]"
                    >
                      <p className="text-2xl font-bold text-primary-500">
                        {format(new Date(apt.date), 'HH:mm')}
                      </p>
                      <p className="text-dark-400 text-sm">{apt.service?.duration} min</p>
                    </motion.div>
                    <div>
                      <p className="font-semibold text-white">{apt.client?.name}</p>
                      <p className="text-dark-400">{apt.service?.name}</p>
                      <p className="text-dark-500 text-sm">com {apt.barber?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge
                      variant={statusConfig[apt.status]?.variant || 'neutral'}
                    >
                      {statusConfig[apt.status]?.label || apt.status}
                    </Badge>

                    {apt.status === 'SCHEDULED' && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleStart(apt.id)}
                          leftIcon={<PlayIcon className="w-4 h-4" />}
                        >
                          Iniciar
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openNoShowDialog(apt)}
                        >
                          Não veio
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => openCancelDialog(apt)}
                          leftIcon={<XMarkIcon className="w-4 h-4" />}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}

                    {apt.status === 'IN_PROGRESS' && !apt.checkout && (
                      <a href={`/dashboard/checkout?appointmentId=${apt.id}`}>
                        <Button
                          leftIcon={<CheckIcon className="w-4 h-4" />}
                        >
                          Finalizar
                        </Button>
                      </a>
                    )}
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Novo Agendamento" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Cliente */}
          <Controller
            name="clientId"
            control={control}
            rules={{ required: 'Cliente é obrigatório' }}
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

          {/* Barbeiro e Serviço em grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="barberId"
              control={control}
              rules={{ required: 'Barbeiro é obrigatório' }}
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
              rules={{ required: 'Serviço é obrigatório' }}
              render={({ field }) => (
                <SearchableSelect
                  label="Serviço"
                  value={field.value}
                  onChange={field.onChange}
                  options={serviceOptions}
                  placeholder="Selecione o serviço"
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
                <span className="text-dark-400">Duração estimada:</span>
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

          {/* Data e Horário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="date"
              control={control}
              rules={{ required: 'Data é obrigatória' }}
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
              rules={{ required: 'Horário é obrigatório' }}
              render={({ field }) => (
                <TimePicker
                  label="Horário"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecione o horário"
                  error={errors.time?.message as string}
                  required
                />
              )}
            />
          </div>

          {/* Observações */}
          <Textarea
            label="Observações"
            placeholder="Observações sobre o agendamento..."
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
        title="Cliente Não Compareceu"
        message={`Marcar ${noShowDialog.appointment?.client?.name} como não compareceu?`}
        variant="warning"
        confirmText="Confirmar"
      />
    </PageTransition>
  );
}
