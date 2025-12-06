'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { financialApi, appointmentsApi, productsApi } from '@/lib/api';
import { DashboardStats, Appointment, Product } from '@/types';
import {
  CurrencyDollarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, appointmentsRes, lowStockRes] = await Promise.all([
          financialApi.getDashboard(),
          appointmentsApi.getToday(),
          productsApi.getLowStock(),
        ]);

        setStats(statsRes.data);
        setTodayAppointments(appointmentsRes.data);
        setLowStockProducts(lowStockRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <PageLoading />;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
      />

      <div className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-card-title">Receita Hoje</span>
              <CurrencyDollarIcon className="w-6 h-6 text-green-500" />
            </div>
            <span className="stat-card-value text-green-500">
              {formatCurrency(stats?.today.revenue || 0)}
            </span>
            <span className="stat-card-subtitle">
              {stats?.today.checkouts || 0} atendimentos
            </span>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-card-title">Agendamentos Hoje</span>
              <CalendarDaysIcon className="w-6 h-6 text-blue-500" />
            </div>
            <span className="stat-card-value text-blue-500">
              {stats?.today.appointments || 0}
            </span>
            <span className="stat-card-subtitle">
              {stats?.today.completedAppointments || 0} concluídos
            </span>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-card-title">Receita do Mês</span>
              <ArrowTrendingUpIcon className="w-6 h-6 text-primary-500" />
            </div>
            <span className="stat-card-value text-primary-500">
              {formatCurrency(stats?.month.revenue || 0)}
            </span>
            <span className="stat-card-subtitle">
              Lucro: {formatCurrency(stats?.month.profit || 0)}
            </span>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-card-title">Clientes Ativos</span>
              <UserGroupIcon className="w-6 h-6 text-purple-500" />
            </div>
            <span className="stat-card-value text-purple-500">
              {stats?.totals.activeClients || 0}
            </span>
            <span className="stat-card-subtitle">cadastrados</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Appointments */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">
              Agendamentos de Hoje
            </h3>
            {todayAppointments.length === 0 ? (
              <p className="text-dark-400">Nenhum agendamento para hoje</p>
            ) : (
              <div className="space-y-3">
                {todayAppointments.slice(0, 5).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 bg-dark-800 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {appointment.client?.name}
                      </p>
                      <p className="text-sm text-dark-400">
                        {appointment.service?.name} - {appointment.barber?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary-500 font-medium">
                        {format(new Date(appointment.date), 'HH:mm')}
                      </p>
                      <span
                        className={`badge ${
                          appointment.status === 'COMPLETED'
                            ? 'badge-success'
                            : appointment.status === 'IN_PROGRESS'
                            ? 'badge-warning'
                            : appointment.status === 'CANCELLED'
                            ? 'badge-danger'
                            : 'badge-info'
                        }`}
                      >
                        {appointment.status === 'COMPLETED' && 'Concluído'}
                        {appointment.status === 'IN_PROGRESS' && 'Em andamento'}
                        {appointment.status === 'SCHEDULED' && 'Agendado'}
                        {appointment.status === 'CANCELLED' && 'Cancelado'}
                        {appointment.status === 'NO_SHOW' && 'Não compareceu'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock Alert */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-white">
                Estoque Baixo ({lowStockProducts.length})
              </h3>
            </div>
            {lowStockProducts.length === 0 ? (
              <p className="text-dark-400">Nenhum produto com estoque baixo</p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-dark-800 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-sm text-dark-400">
                        {product.category?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-500 font-medium">
                        {product.quantity} un
                      </p>
                      <p className="text-sm text-dark-400">
                        Mín: {product.minQuantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Monthly Overview */}
        <div className="mt-6 card">
          <h3 className="text-lg font-semibold text-white mb-4">
            Resumo do Mês
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-dark-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                <span className="text-dark-400">Entradas</span>
              </div>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(stats?.month.revenue || 0)}
              </p>
            </div>
            <div className="p-4 bg-dark-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
                <span className="text-dark-400">Saídas</span>
              </div>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(stats?.month.expenses || 0)}
              </p>
            </div>
            <div className="p-4 bg-dark-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="w-5 h-5 text-primary-500" />
                <span className="text-dark-400">Lucro</span>
              </div>
              <p className="text-2xl font-bold text-primary-500">
                {formatCurrency(stats?.month.profit || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
