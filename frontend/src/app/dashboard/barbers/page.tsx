'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { barbersApi } from '@/lib/api';
import { Barber } from '@/types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, ScissorsIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function BarbersPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [selectedBarberStats, setSelectedBarberStats] = useState<any>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

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

  const onSubmit = async (data: any) => {
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

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza?')) return;
    try {
      await barbersApi.delete(id);
      toast.success('Barbeiro desativado!');
      fetchBarbers();
    } catch (error) {
      toast.error('Erro ao desativar');
    }
  };

  const viewStats = async (barber: Barber) => {
    try {
      const response = await barbersApi.getDashboard(barber.id);
      setSelectedBarberStats(response.data);
      setIsStatsModalOpen(true);
    } catch (error) {
      toast.error('Erro ao carregar estatísticas');
    }
  };

  if (isLoading) return <PageLoading />;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <>
      <Header title="Barbeiros" subtitle={`${barbers.length} barbeiros`} />

      <div className="p-8">
        <div className="flex justify-end mb-6">
          <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Novo Barbeiro
          </button>
        </div>

        {barbers.length === 0 ? (
          <EmptyState
            icon={<ScissorsIcon className="w-16 h-16" />}
            title="Nenhum barbeiro cadastrado"
            action={<button onClick={() => openModal()} className="btn btn-primary">Cadastrar</button>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbers.map((barber) => (
              <div key={barber.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{barber.name}</h3>
                    <p className="text-dark-400 text-sm">{barber.phone}</p>
                  </div>
                  <span className={`badge ${barber.isActive ? 'badge-success' : 'badge-neutral'}`}>
                    {barber.isActive ? 'Ativo' : 'Inativo'}
                  </span>
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

                <div className="flex items-center gap-2 pt-4 border-t border-dark-800">
                  <button
                    onClick={() => viewStats(barber)}
                    className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    <ChartBarIcon className="w-4 h-4" />
                    Estatísticas
                  </button>
                  <button
                    onClick={() => openModal(barber)}
                    className="p-2 text-dark-400 hover:text-primary-500"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(barber.id)}
                    className="p-2 text-dark-400 hover:text-red-500"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingBarber ? 'Editar Barbeiro' : 'Novo Barbeiro'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" {...register('name', { required: 'Obrigatório' })} />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>}
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" {...register('phone')} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" {...register('email')} />
          </div>
          <div>
            <label className="label">Especialidades (separadas por vírgula)</label>
            <input className="input" placeholder="Corte, Barba, Degradê" {...register('specialties')} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" {...register('isActive')} className="w-4 h-4" />
            <label htmlFor="isActive" className="text-dark-300">Ativo</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={closeModal} className="btn btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stats Modal */}
      <Modal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} title="Estatísticas do Barbeiro" size="lg">
        {selectedBarberStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-dark-800 p-4 rounded-lg text-center">
                <p className="text-dark-400 text-sm">Receita Total</p>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(selectedBarberStats.stats.totalRevenue)}
                </p>
              </div>
              <div className="bg-dark-800 p-4 rounded-lg text-center">
                <p className="text-dark-400 text-sm">Atendimentos</p>
                <p className="text-2xl font-bold text-primary-500">
                  {selectedBarberStats.stats.totalAppointments}
                </p>
              </div>
              <div className="bg-dark-800 p-4 rounded-lg text-center">
                <p className="text-dark-400 text-sm">Ticket Médio</p>
                <p className="text-2xl font-bold text-blue-500">
                  {formatCurrency(selectedBarberStats.stats.averageTicket)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Serviços Mais Realizados</h4>
              <div className="space-y-2">
                {selectedBarberStats.topServices.map((s: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-dark-800 p-3 rounded-lg">
                    <span className="text-white">{s.name}</span>
                    <div className="text-right">
                      <span className="text-dark-400">{s.count}x</span>
                      <span className="text-green-500 ml-4">{formatCurrency(s.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
