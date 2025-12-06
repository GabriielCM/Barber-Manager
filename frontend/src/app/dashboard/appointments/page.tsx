'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { appointmentsApi, clientsApi, barbersApi, servicesApi } from '@/lib/api';
import { Appointment, Client, Barber, Service } from '@/types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PlusIcon, CalendarDaysIcon, PlayIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

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
      date: selectedDate,
      time: '09:00',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); reset(); };

  const onSubmit = async (data: any) => {
    const dateTime = new Date(`${data.date}T${data.time}:00`);
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

  const handleCancel = async (id: string) => {
    if (!confirm('Cancelar agendamento?')) return;
    try {
      await appointmentsApi.cancel(id);
      toast.success('Agendamento cancelado!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao cancelar');
    }
  };

  const handleNoShow = async (id: string) => {
    if (!confirm('Marcar como não compareceu?')) return;
    try {
      await appointmentsApi.update(id, { status: 'NO_SHOW' });
      toast.success('Marcado como não compareceu');
      fetchData();
    } catch (error) {
      toast.error('Erro');
    }
  };

  if (isLoading) return <PageLoading />;

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      SCHEDULED: { class: 'badge-info', label: 'Agendado' },
      IN_PROGRESS: { class: 'badge-warning', label: 'Em andamento' },
      COMPLETED: { class: 'badge-success', label: 'Concluído' },
      CANCELLED: { class: 'badge-danger', label: 'Cancelado' },
      NO_SHOW: { class: 'badge-neutral', label: 'Não compareceu' },
    };
    const badge = badges[status];
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  return (
    <>
      <Header
        title="Agendamentos"
        subtitle={format(new Date(selectedDate + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
      />

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input w-48"
          />
          <button onClick={openModal} className="btn btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Novo Agendamento
          </button>
        </div>

        {appointments.length === 0 ? (
          <EmptyState
            icon={<CalendarDaysIcon className="w-16 h-16" />}
            title="Nenhum agendamento para esta data"
            action={<button onClick={openModal} className="btn btn-primary">Agendar</button>}
          />
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div key={apt.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-500">
                      {format(new Date(apt.date), 'HH:mm')}
                    </p>
                    <p className="text-dark-400 text-sm">{apt.service?.duration} min</p>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{apt.client?.name}</p>
                    <p className="text-dark-400">{apt.service?.name}</p>
                    <p className="text-dark-500 text-sm">com {apt.barber?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {getStatusBadge(apt.status)}

                  {apt.status === 'SCHEDULED' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStart(apt.id)}
                        className="btn btn-success flex items-center gap-1"
                      >
                        <PlayIcon className="w-4 h-4" />
                        Iniciar
                      </button>
                      <button
                        onClick={() => handleNoShow(apt.id)}
                        className="btn btn-secondary"
                      >
                        Não veio
                      </button>
                      <button
                        onClick={() => handleCancel(apt.id)}
                        className="btn btn-danger flex items-center gap-1"
                      >
                        <XMarkIcon className="w-4 h-4" />
                        Cancelar
                      </button>
                    </div>
                  )}

                  {apt.status === 'IN_PROGRESS' && !apt.checkout && (
                    <a
                      href={`/dashboard/checkout?appointmentId=${apt.id}`}
                      className="btn btn-primary flex items-center gap-1"
                    >
                      <CheckIcon className="w-4 h-4" />
                      Finalizar
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Novo Agendamento" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Cliente *</label>
            <select className="input" {...register('clientId', { required: 'Obrigatório' })}>
              <option value="">Selecione...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
              ))}
            </select>
            {errors.clientId && <p className="text-red-500 text-sm mt-1">{errors.clientId.message as string}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Barbeiro *</label>
              <select className="input" {...register('barberId', { required: 'Obrigatório' })}>
                <option value="">Selecione...</option>
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Serviço *</label>
              <select className="input" {...register('serviceId', { required: 'Obrigatório' })}>
                <option value="">Selecione...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data *</label>
              <input type="date" className="input" {...register('date', { required: 'Obrigatório' })} />
            </div>
            <div>
              <label className="label">Horário *</label>
              <input type="time" className="input" {...register('time', { required: 'Obrigatório' })} />
            </div>
          </div>

          <div>
            <label className="label">Observações</label>
            <textarea className="input" {...register('notes')} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={closeModal} className="btn btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Agendando...' : 'Agendar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
