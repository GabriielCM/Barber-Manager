import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateGoalDto, GoalType } from './dto/create-goal.dto';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  async createTransaction(dto: CreateTransactionDto) {
    return this.prisma.financialTransaction.create({
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });
  }

  async findAllTransactions(params?: {
    skip?: number;
    take?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
    category?: string;
  }) {
    const { skip = 0, take = 50, startDate, endDate, type, category } = params || {};

    const where: any = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (type) where.type = type;
    if (category) where.category = category;

    const [transactions, total] = await Promise.all([
      this.prisma.financialTransaction.findMany({
        where,
        skip,
        take,
        include: { checkout: true },
        orderBy: { date: 'desc' },
      }),
      this.prisma.financialTransaction.count({ where }),
    ]);

    return { transactions, total };
  }

  async deleteTransaction(id: string) {
    const transaction = await this.prisma.financialTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    if (transaction.checkoutId) {
      throw new NotFoundException(
        'Não é possível excluir transações vinculadas a checkouts',
      );
    }

    return this.prisma.financialTransaction.delete({ where: { id } });
  }

  async getDailyCashFlow(date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: { checkout: true },
    });

    const income = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Contar checkouts do dia
    const checkouts = await this.prisma.checkout.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        services: true,
        products: true,
      },
    });

    const serviceCount = checkouts.reduce(
      (sum, c) => sum + c.services.length,
      0,
    );
    const productCount = checkouts.reduce(
      (sum, c) => sum + c.products.reduce((s, p) => s + p.quantity, 0),
      0,
    );

    const uniqueClients = new Set(checkouts.map((c) => c.clientId)).size;

    return {
      date,
      income,
      expense,
      balance: income - expense,
      serviceCount,
      productCount,
      clientCount: uniqueClients,
      checkoutCount: checkouts.length,
      transactions,
    };
  }

  async getWeeklyCashFlow(startDate: string) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      const dayFlow = await this.getDailyCashFlow(day.toISOString().split('T')[0]);
      days.push(dayFlow);
    }

    const totals = days.reduce(
      (acc, day) => ({
        income: acc.income + day.income,
        expense: acc.expense + day.expense,
        balance: acc.balance + day.balance,
        serviceCount: acc.serviceCount + day.serviceCount,
        productCount: acc.productCount + day.productCount,
        clientCount: acc.clientCount + day.clientCount,
        checkoutCount: acc.checkoutCount + day.checkoutCount,
      }),
      {
        income: 0,
        expense: 0,
        balance: 0,
        serviceCount: 0,
        productCount: 0,
        clientCount: 0,
        checkoutCount: 0,
      },
    );

    return {
      startDate,
      endDate: end.toISOString().split('T')[0],
      days,
      totals,
    };
  }

  async getMonthlyCashFlow(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const income = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Agrupar por categoria
    const byCategory = transactions.reduce(
      (acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = { income: 0, expense: 0 };
        }
        if (t.type === 'INCOME') {
          acc[t.category].income += Number(t.amount);
        } else {
          acc[t.category].expense += Number(t.amount);
        }
        return acc;
      },
      {} as Record<string, { income: number; expense: number }>,
    );

    // Agrupar por dia
    const byDay = transactions.reduce(
      (acc, t) => {
        const day = t.date.toISOString().split('T')[0];
        if (!acc[day]) {
          acc[day] = { income: 0, expense: 0 };
        }
        if (t.type === 'INCOME') {
          acc[day].income += Number(t.amount);
        } else {
          acc[day].expense += Number(t.amount);
        }
        return acc;
      },
      {} as Record<string, { income: number; expense: number }>,
    );

    return {
      year,
      month,
      income,
      expense,
      balance: income - expense,
      byCategory,
      byDay,
    };
  }

  async getReportByBarber(startDate: string, endDate: string) {
    const checkouts = await this.prisma.checkout.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        barber: true,
        services: { include: { service: true } },
      },
    });

    const barberStats = checkouts.reduce(
      (acc, checkout) => {
        const barberId = checkout.barberId;
        if (!acc[barberId]) {
          acc[barberId] = {
            barber: checkout.barber,
            totalRevenue: 0,
            serviceCount: 0,
            checkoutCount: 0,
            services: {} as Record<string, { name: string; count: number; revenue: number }>,
          };
        }

        acc[barberId].totalRevenue += Number(checkout.total);
        acc[barberId].checkoutCount++;
        acc[barberId].serviceCount += checkout.services.length;

        checkout.services.forEach((s) => {
          if (!acc[barberId].services[s.serviceId]) {
            acc[barberId].services[s.serviceId] = {
              name: s.service.name,
              count: 0,
              revenue: 0,
            };
          }
          acc[barberId].services[s.serviceId].count++;
          acc[barberId].services[s.serviceId].revenue += Number(s.price);
        });

        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.values(barberStats).map((stat: any) => ({
      ...stat,
      services: Object.values(stat.services),
      averageTicket: stat.checkoutCount > 0 ? stat.totalRevenue / stat.checkoutCount : 0,
    }));
  }

  async getReportByClient(startDate: string, endDate: string) {
    const checkouts = await this.prisma.checkout.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        client: true,
      },
    });

    const clientStats = checkouts.reduce(
      (acc, checkout) => {
        const clientId = checkout.clientId;
        if (!acc[clientId]) {
          acc[clientId] = {
            client: checkout.client,
            totalSpent: 0,
            visitCount: 0,
          };
        }

        acc[clientId].totalSpent += Number(checkout.total);
        acc[clientId].visitCount++;

        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.values(clientStats)
      .map((stat: any) => ({
        ...stat,
        averageTicket: stat.visitCount > 0 ? stat.totalSpent / stat.visitCount : 0,
      }))
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent);
  }

  async getReportByService(startDate: string, endDate: string) {
    const checkoutServices = await this.prisma.checkoutService.findMany({
      where: {
        checkout: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      },
      include: {
        service: true,
      },
    });

    const serviceStats = checkoutServices.reduce(
      (acc, cs) => {
        const serviceId = cs.serviceId;
        if (!acc[serviceId]) {
          acc[serviceId] = {
            service: cs.service,
            count: 0,
            revenue: 0,
          };
        }

        acc[serviceId].count++;
        acc[serviceId].revenue += Number(cs.price);

        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.values(serviceStats).sort(
      (a: any, b: any) => b.revenue - a.revenue,
    );
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Estatísticas de hoje
    const todayCheckouts = await this.prisma.checkout.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    const todayRevenue = todayCheckouts.reduce(
      (sum, c) => sum + Number(c.total),
      0,
    );

    // Estatísticas do mês
    const monthCheckouts = await this.prisma.checkout.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startOfMonth },
      },
    });

    const monthRevenue = monthCheckouts.reduce(
      (sum, c) => sum + Number(c.total),
      0,
    );

    // Despesas do mês
    const monthExpenses = await this.prisma.financialTransaction.findMany({
      where: {
        type: 'EXPENSE',
        date: { gte: startOfMonth },
      },
    });

    const totalExpenses = monthExpenses.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );

    // Agendamentos de hoje
    const todayAppointments = await this.prisma.appointment.count({
      where: {
        date: { gte: today, lt: tomorrow },
      },
    });

    const completedToday = await this.prisma.appointment.count({
      where: {
        date: { gte: today, lt: tomorrow },
        status: 'COMPLETED',
      },
    });

    // Produtos com estoque baixo
    const lowStockProducts = await this.prisma.product.findMany({
      where: { isActive: true },
    });

    const lowStockCount = lowStockProducts.filter(
      (p) => p.quantity <= p.minQuantity,
    ).length;

    // Clientes ativos
    const activeClients = await this.prisma.client.count({
      where: { status: 'ACTIVE' },
    });

    return {
      today: {
        revenue: todayRevenue,
        checkouts: todayCheckouts.length,
        appointments: todayAppointments,
        completedAppointments: completedToday,
      },
      month: {
        revenue: monthRevenue,
        expenses: totalExpenses,
        profit: monthRevenue - totalExpenses,
        checkouts: monthCheckouts.length,
      },
      alerts: {
        lowStockCount,
      },
      totals: {
        activeClients,
      },
    };
  }

  // ============== METAS FINANCEIRAS ==============

  async createOrUpdateGoal(dto: CreateGoalDto) {
    const existing = await this.prisma.financialGoal.findUnique({
      where: {
        type_month_year: {
          type: dto.type,
          month: dto.month,
          year: dto.year,
        },
      },
    });

    if (existing) {
      return this.prisma.financialGoal.update({
        where: { id: existing.id },
        data: { targetValue: dto.targetValue },
      });
    }

    return this.prisma.financialGoal.create({
      data: {
        type: dto.type,
        targetValue: dto.targetValue,
        month: dto.month,
        year: dto.year,
      },
    });
  }

  async getGoals(year: number, month: number) {
    return this.prisma.financialGoal.findMany({
      where: { year, month },
    });
  }

  async getGoalProgress(year: number, month: number) {
    const goals = await this.getGoals(year, month);
    const monthlyData = await this.getMonthlyCashFlow(year, month);
    const monthCheckouts = await this.prisma.checkout.count({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0),
        },
      },
    });

    return goals.map((goal) => {
      let currentValue = 0;

      if (goal.type === 'REVENUE') {
        currentValue = monthlyData.income;
      } else if (goal.type === 'PROFIT') {
        currentValue = monthlyData.balance;
      } else if (goal.type === 'CLIENTS') {
        currentValue = monthCheckouts;
      }

      const targetValue = Number(goal.targetValue);
      const progress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;

      return {
        ...goal,
        targetValue,
        currentValue,
        progress: Math.round(progress * 100) / 100,
        remaining: Math.max(0, targetValue - currentValue),
      };
    });
  }

  async deleteGoal(id: string) {
    const goal = await this.prisma.financialGoal.findUnique({
      where: { id },
    });

    if (!goal) {
      throw new NotFoundException('Meta não encontrada');
    }

    return this.prisma.financialGoal.delete({ where: { id } });
  }

  // ============== EXPORTAÇÃO ==============

  async exportToCSV(startDate: string, endDate: string): Promise<string> {
    const { transactions } = await this.findAllTransactions({
      startDate,
      endDate,
      take: 10000,
    });

    const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor'];
    const rows = transactions.map((t) => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.type === 'INCOME' ? 'Entrada' : 'Saída',
      this.getCategoryLabel(t.category),
      `"${t.description.replace(/"/g, '""')}"`,
      Number(t.amount).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
    ]);

    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    return '\uFEFF' + csv;
  }

  async exportToPDF(startDate: string, endDate: string): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    const { transactions } = await this.findAllTransactions({
      startDate,
      endDate,
      take: 10000,
    });

    const monthlyData = await this.calculatePeriodSummary(startDate, endDate);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .fillColor('#333')
        .text('Relatório Financeiro', { align: 'center' });

      doc
        .fontSize(12)
        .fillColor('#666')
        .text(
          `Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`,
          { align: 'center' },
        );

      doc.moveDown(2);

      // Summary Cards
      doc.fontSize(14).fillColor('#333').text('Resumo do Período');
      doc.moveDown(0.5);

      const formatCurrency = (value: number) =>
        value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      doc
        .fontSize(11)
        .fillColor('#22c55e')
        .text(`Receitas: ${formatCurrency(monthlyData.income)}`);
      doc
        .fillColor('#ef4444')
        .text(`Despesas: ${formatCurrency(monthlyData.expense)}`);
      doc
        .fillColor(monthlyData.balance >= 0 ? '#22c55e' : '#ef4444')
        .text(`Saldo: ${formatCurrency(monthlyData.balance)}`);

      doc.moveDown(2);

      // Transactions Table
      doc.fontSize(14).fillColor('#333').text('Transações');
      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      const colWidths = [70, 60, 80, 180, 80];
      const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor'];

      doc.fontSize(9).fillColor('#666');
      let xPos = 50;
      headers.forEach((header, i) => {
        doc.text(header, xPos, tableTop, { width: colWidths[i] });
        xPos += colWidths[i];
      });

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(545, tableTop + 15)
        .stroke('#ddd');

      // Table rows
      let yPos = tableTop + 25;
      doc.fontSize(8).fillColor('#333');

      transactions.slice(0, 50).forEach((t) => {
        if (yPos > 750) {
          doc.addPage();
          yPos = 50;
        }

        xPos = 50;
        const rowData = [
          new Date(t.date).toLocaleDateString('pt-BR'),
          t.type === 'INCOME' ? 'Entrada' : 'Saída',
          this.getCategoryLabel(t.category),
          t.description.substring(0, 35),
          formatCurrency(Number(t.amount)),
        ];

        doc.fillColor(t.type === 'INCOME' ? '#22c55e' : '#ef4444');

        rowData.forEach((cell, i) => {
          doc.fillColor(i === 4 ? (t.type === 'INCOME' ? '#22c55e' : '#ef4444') : '#333');
          doc.text(cell, xPos, yPos, { width: colWidths[i] });
          xPos += colWidths[i];
        });

        yPos += 18;
      });

      if (transactions.length > 50) {
        doc
          .moveDown()
          .fontSize(9)
          .fillColor('#666')
          .text(`... e mais ${transactions.length - 50} transações`, {
            align: 'center',
          });
      }

      // Footer
      doc
        .fontSize(8)
        .fillColor('#999')
        .text(
          `Gerado em ${new Date().toLocaleString('pt-BR')} - Barber Manager`,
          50,
          780,
          { align: 'center' },
        );

      doc.end();
    });
  }

  private async calculatePeriodSummary(startDate: string, endDate: string) {
    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });

    const income = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }

  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      SERVICE: 'Serviço',
      PRODUCT: 'Produto',
      PACKAGE: 'Pacote',
      SUPPLIES: 'Insumos',
      RENT: 'Aluguel',
      UTILITIES: 'Utilidades',
      SALARY: 'Salário',
      MAINTENANCE: 'Manutenção',
      MARKETING: 'Marketing',
      OTHER: 'Outro',
    };
    return labels[category] || category;
  }
}
