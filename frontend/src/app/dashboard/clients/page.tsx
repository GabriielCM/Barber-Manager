'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { clientsApi } from '@/lib/api';
import { Client } from '@/types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

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
        birthDate: client.birthDate ? client.birthDate.split('T')[0] : '',
        observations: client.observations || '',
        status: client.status,
      });
    } else {
      setEditingClient(null);
      reset({
        name: '',
        phone: '',
        email: '',
        birthDate: '',
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

  const onSubmit = async (data: any) => {
    try {
      if (editingClient) {
        await clientsApi.update(editingClient.id, data);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await clientsApi.create(data);
        toast.success('Cliente criado com sucesso!');
      }
      closeModal();
      fetchClients();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar cliente');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      await clientsApi.delete(id);
      toast.success('Cliente excluído com sucesso!');
      fetchClients();
    } catch (error) {
      toast.error('Erro ao excluir cliente');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      ACTIVE: 'badge-success',
      INACTIVE: 'badge-neutral',
      BANNED: 'badge-danger',
      DEFAULTER: 'badge-warning',
    };
    const labels: Record<string, string> = {
      ACTIVE: 'Ativo',
      INACTIVE: 'Inativo',
      BANNED: 'Banido',
      DEFAULTER: 'Inadimplente',
    };
    return <span className={`badge ${badges[status]}`}>{labels[status]}</span>;
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <>
      <Header title="Clientes" subtitle={`${total} clientes cadastrados`} />

      <div className="p-8">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-dark-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 w-80"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-40"
            >
              <option value="">Todos</option>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
              <option value="BANNED">Banidos</option>
              <option value="DEFAULTER">Inadimplentes</option>
            </select>
          </div>

          <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Novo Cliente
          </button>
        </div>

        {/* Table */}
        {clients.length === 0 ? (
          <EmptyState
            icon={<UserGroupIcon className="w-16 h-16" />}
            title="Nenhum cliente encontrado"
            description="Comece cadastrando seu primeiro cliente"
            action={
              <button onClick={() => openModal()} className="btn btn-primary">
                Cadastrar Cliente
              </button>
            }
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Total Gasto</th>
                  <th>Faltas</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="font-medium text-white">{client.name}</td>
                    <td>{client.phone}</td>
                    <td>{client.email || '-'}</td>
                    <td>{getStatusBadge(client.status)}</td>
                    <td className="text-green-500">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(client.totalSpent))}
                    </td>
                    <td>
                      {client.noShowCount > 0 ? (
                        <span className="text-red-500">{client.noShowCount}</span>
                      ) : (
                        <span className="text-dark-400">0</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                          className="p-2 text-dark-400 hover:text-white transition-colors"
                          title="Ver detalhes"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openModal(client)}
                          className="p-2 text-dark-400 hover:text-primary-500 transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-2 text-dark-400 hover:text-red-500 transition-colors"
                          title="Excluir"
                        >
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input
              type="text"
              className="input"
              {...register('name', { required: 'Nome é obrigatório' })}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>
            )}
          </div>

          <div>
            <label className="label">Telefone *</label>
            <input
              type="text"
              className="input"
              placeholder="11999999999"
              {...register('phone', { required: 'Telefone é obrigatório' })}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message as string}</p>
            )}
          </div>

          <div>
            <label className="label">Email</label>
            <input type="email" className="input" {...register('email')} />
          </div>

          <div>
            <label className="label">Data de Nascimento</label>
            <input type="date" className="input" {...register('birthDate')} />
          </div>

          <div>
            <label className="label">Status</label>
            <select className="input" {...register('status')}>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="BANNED">Banido</option>
              <option value="DEFAULTER">Inadimplente</option>
            </select>
          </div>

          <div>
            <label className="label">Observações</label>
            <textarea
              className="input min-h-[100px]"
              placeholder="Preferências, alergias, etc..."
              {...register('observations')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={closeModal} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
