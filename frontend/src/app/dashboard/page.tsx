'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
  FadeIn,
  StatCard,
  Card,
  CardTitle,
  Badge,
  AnimatedCurrency,
  AnimatedNumber,
  StatCardSkeleton,
  CardSkeleton,
} from '@/components/ui';
import { financialApi, appointmentsApi, productsApi } from '@/lib/api';
import { DashboardStats, Appointment, Product } from '@/types';
import {
  CurrencyDollarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================
// STATUS BADGE MAP
// ============================================
const statusConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; label: string }> = {
  COMPLETED: { variant: 'success', label: 'Concluído' },
  IN_PROGRESS: { variant: 'warning', label: 'Em andamento' },
  SCHEDULED: { variant: 'info', label: 'Agendado' },
  CANCELLED: { variant: 'danger', label: 'Cancelado' },
  NO_SHOW: { variant: 'neutral', label: 'Não compareceu' },
};

// ============================================
// MAIN PAGE
// ============================================
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

  return (
    <PageTransition>
      <Header
        title="Dashboard"
        subtitle={format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
      />

      <div className="p-8">
        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StaggerItem>
              <StatCard
                title="Receita Hoje"
                value={
                  <AnimatedCurrency
                    value={stats?.today.revenue || 0}
                    className="text-green-500"
                  />
                }
                subtitle={`${stats?.today.checkouts || 0} atendimentos`}
                icon={<CurrencyDollarIcon className="w-6 h-6" />}
                iconColor="text-green-500"
              />
            </StaggerItem>

            <StaggerItem>
              <StatCard
                title="Agendamentos Hoje"
                value={
                  <AnimatedNumber
                    value={stats?.today.appointments || 0}
                    className="text-blue-500"
                  />
                }
                subtitle={`${stats?.today.completedAppointments || 0} concluídos`}
                icon={<CalendarDaysIcon className="w-6 h-6" />}
                iconColor="text-blue-500"
              />
            </StaggerItem>

            <StaggerItem>
              <StatCard
                title="Receita do Mês"
                value={
                  <AnimatedCurrency
                    value={stats?.month.revenue || 0}
                    className="text-primary-500"
                  />
                }
                subtitle={
                  <span>
                    Lucro:{' '}
                    <AnimatedCurrency
                      value={stats?.month.profit || 0}
                      duration={1.2}
                    />
                  </span>
                }
                icon={<ArrowTrendingUpIcon className="w-6 h-6" />}
                iconColor="text-primary-500"
              />
            </StaggerItem>

            <StaggerItem>
              <StatCard
                title="Clientes Ativos"
                value={
                  <AnimatedNumber
                    value={stats?.totals.activeClients || 0}
                    className="text-purple-500"
                  />
                }
                subtitle="cadastrados"
                icon={<UserGroupIcon className="w-6 h-6" />}
                iconColor="text-purple-500"
              />
            </StaggerItem>
          </StaggerContainer>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Appointments */}
          {isLoading ? (
            <CardSkeleton hasFooter />
          ) : (
            <FadeIn delay={0.2}>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle>Agendamentos de Hoje</CardTitle>
                  <Badge variant="info" dot>
                    {todayAppointments.length}
                  </Badge>
                </div>

                {todayAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-dark-400">
                    <CalendarDaysIcon className="w-12 h-12 mb-2 opacity-50" />
                    <p>Nenhum agendamento para hoje</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayAppointments.slice(0, 5).map((appointment, index) => (
                      <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-dark-800 rounded-lg hover:bg-dark-800/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center',
                              appointment.status === 'COMPLETED'
                                ? 'bg-green-500/20'
                                : appointment.status === 'IN_PROGRESS'
                                ? 'bg-yellow-500/20'
                                : 'bg-blue-500/20'
                            )}
                          >
                            {appointment.status === 'COMPLETED' ? (
                              <CheckCircleIcon className="w-5 h-5 text-green-500" />
                            ) : (
                              <ClockIcon
                                className={cn(
                                  'w-5 h-5',
                                  appointment.status === 'IN_PROGRESS'
                                    ? 'text-yellow-500'
                                    : 'text-blue-500'
                                )}
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {appointment.client?.name}
                            </p>
                            <p className="text-sm text-dark-400">
                              {appointment.service?.name} - {appointment.barber?.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-primary-500 font-medium">
                            {format(new Date(appointment.date), 'HH:mm')}
                          </p>
                          <Badge
                            variant={statusConfig[appointment.status]?.variant || 'neutral'}
                            size="sm"
                          >
                            {statusConfig[appointment.status]?.label || appointment.status}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </FadeIn>
          )}

          {/* Low Stock Alert */}
          {isLoading ? (
            <CardSkeleton hasFooter />
          ) : (
            <FadeIn delay={0.3}>
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                  <CardTitle>Estoque Baixo</CardTitle>
                  <Badge variant="warning" className="ml-auto">
                    {lowStockProducts.length}
                  </Badge>
                </div>

                {lowStockProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-dark-400">
                    <CheckCircleIcon className="w-12 h-12 mb-2 text-green-500 opacity-50" />
                    <p>Todos os produtos com estoque adequado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lowStockProducts.slice(0, 5).map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-dark-800 rounded-lg hover:bg-dark-800/80 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-sm text-dark-400">
                            {product.category?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              'font-medium',
                              product.quantity <= (product.minQuantity || 0) / 2
                                ? 'text-red-500'
                                : 'text-yellow-500'
                            )}
                          >
                            {product.quantity} un
                          </p>
                          <p className="text-sm text-dark-400">
                            Mín: {product.minQuantity}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </FadeIn>
          )}
        </div>

        {/* Monthly Overview */}
        {isLoading ? (
          <div className="mt-6">
            <CardSkeleton />
          </div>
        ) : (
          <FadeIn delay={0.4}>
            <Card className="mt-6">
              <CardTitle className="mb-4">Resumo do Mês</CardTitle>
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StaggerItem>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="p-4 bg-dark-800 rounded-lg border border-dark-700 hover:border-green-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                      <span className="text-dark-400">Entradas</span>
                    </div>
                    <AnimatedCurrency
                      value={stats?.month.revenue || 0}
                      className="text-2xl font-bold text-green-500"
                    />
                  </motion.div>
                </StaggerItem>

                <StaggerItem>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="p-4 bg-dark-800 rounded-lg border border-dark-700 hover:border-red-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
                      <span className="text-dark-400">Saídas</span>
                    </div>
                    <AnimatedCurrency
                      value={stats?.month.expenses || 0}
                      className="text-2xl font-bold text-red-500"
                    />
                  </motion.div>
                </StaggerItem>

                <StaggerItem>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="p-4 bg-dark-800 rounded-lg border border-dark-700 hover:border-primary-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CurrencyDollarIcon className="w-5 h-5 text-primary-500" />
                      <span className="text-dark-400">Lucro</span>
                    </div>
                    <AnimatedCurrency
                      value={stats?.month.profit || 0}
                      className="text-2xl font-bold text-primary-500"
                    />
                  </motion.div>
                </StaggerItem>
              </StaggerContainer>
            </Card>
          </FadeIn>
        )}
      </div>
    </PageTransition>
  );
}
