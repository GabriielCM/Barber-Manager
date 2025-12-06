'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { clientsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [history, setHistory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await clientsApi.getHistory(params.id as string);
        setHistory(response.data);
      } catch (error) {
        toast.error('Erro ao carregar dados do cliente');
        router.push('/dashboard/clients');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) fetchData();
  }, [params.id]);

  if (isLoading) return <PageLoading />;
  if (!history) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <>
      <Header title={history.client.name} subtitle="Histórico do cliente" />

      <div className="p-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-dark-400 hover:text-white mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Voltar
        </button>

        {/* Client Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Informações</h3>
            <div className="space-y-3">
              <div>
                <span className="text-dark-400 text-sm">Telefone</span>
                <p className="text-white">{history.client.phone}</p>
              </div>
              <div>
                <span className="text-dark-400 text-sm">Email</span>
                <p className="text-white">{history.client.email || '-'}</p>
              </div>
              <div>
                <span className="text-dark-400 text-sm">Status</span>
                <p className="text-white">{history.client.status}</p>
              </div>
              <div>
                <span className="text-dark-400 text-sm">Cliente desde</span>
                <p className="text-white">
                  {format(new Date(history.client.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Estatísticas</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-dark-400">Total Gasto</span>
                <span className="text-green-500 font-semibold">
                  {formatCurrency(history.stats.totalSpent)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Ticket Médio</span>
                <span className="text-primary-500 font-semibold">
                  {formatCurrency(history.stats.ticketMedio)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Total de Visitas</span>
                <span className="text-white">{history.stats.totalVisits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Visitas este Mês</span>
                <span className="text-white">{history.stats.visitsThisMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Faltas (No-show)</span>
                <span className={history.stats.noShowCount > 0 ? 'text-red-500' : 'text-white'}>
                  {history.stats.noShowCount}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Serviços Favoritos</h3>
            {history.topServices.length === 0 ? (
              <p className="text-dark-400">Nenhum serviço realizado</p>
            ) : (
              <div className="space-y-2">
                {history.topServices.map((service: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-white">{service.name}</span>
                    <span className="text-dark-400">{service.count}x</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Últimos Agendamentos</h3>
          {history.recentAppointments.length === 0 ? (
            <p className="text-dark-400">Nenhum agendamento encontrado</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Serviço</th>
                    <th>Barbeiro</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.recentAppointments.map((apt: any) => (
                    <tr key={apt.id}>
                      <td>
                        {format(new Date(apt.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </td>
                      <td>{apt.service?.name}</td>
                      <td>{apt.barber?.name}</td>
                      <td>
                        <span
                          className={`badge ${
                            apt.status === 'COMPLETED' ? 'badge-success' :
                            apt.status === 'CANCELLED' ? 'badge-danger' : 'badge-info'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
