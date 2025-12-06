'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { servicesApi } from '@/lib/api';
import { Service } from '@/types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza?')) return;
    try {
      await servicesApi.delete(id);
      toast.success('Serviço desativado!');
      fetchServices();
    } catch (error) {
      toast.error('Erro ao desativar');
    }
  };

  if (isLoading) return <PageLoading />;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <>
      <Header title="Serviços" subtitle={`${services.length} serviços`} />

      <div className="p-8">
        <div className="flex justify-end mb-6">
          <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Novo Serviço
          </button>
        </div>

        {services.length === 0 ? (
          <EmptyState
            icon={<WrenchScrewdriverIcon className="w-16 h-16" />}
            title="Nenhum serviço cadastrado"
            action={<button onClick={() => openModal()} className="btn btn-primary">Cadastrar</button>}
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Preço</th>
                  <th>Duração</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td className="font-medium text-white">{service.name}</td>
                    <td className="text-dark-400 max-w-xs truncate">{service.description || '-'}</td>
                    <td className="text-green-500 font-semibold">{formatCurrency(service.price)}</td>
                    <td>{service.duration} min</td>
                    <td>
                      <span className={`badge ${service.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        {service.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openModal(service)} className="p-2 text-dark-400 hover:text-primary-500">
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(service.id)} className="p-2 text-dark-400 hover:text-red-500">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingService ? 'Editar Serviço' : 'Novo Serviço'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" {...register('name', { required: 'Obrigatório' })} />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>}
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input" {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Preço (R$) *</label>
              <input type="number" step="0.01" className="input" {...register('price', { required: 'Obrigatório' })} />
            </div>
            <div>
              <label className="label">Duração (min) *</label>
              <input type="number" className="input" {...register('duration', { required: 'Obrigatório' })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={closeModal} className="btn btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
