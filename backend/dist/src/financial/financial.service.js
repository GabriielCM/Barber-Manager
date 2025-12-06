"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FinancialService = class FinancialService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTransaction(dto) {
        return this.prisma.financialTransaction.create({
            data: {
                ...dto,
                date: dto.date ? new Date(dto.date) : new Date(),
            },
        });
    }
    async findAllTransactions(params) {
        const { skip = 0, take = 50, startDate, endDate, type, category } = params || {};
        const where = {};
        if (startDate || endDate) {
            where.date = {};
            if (startDate)
                where.date.gte = new Date(startDate);
            if (endDate)
                where.date.lte = new Date(endDate);
        }
        if (type)
            where.type = type;
        if (category)
            where.category = category;
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
    async deleteTransaction(id) {
        const transaction = await this.prisma.financialTransaction.findUnique({
            where: { id },
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transação não encontrada');
        }
        if (transaction.checkoutId) {
            throw new common_1.NotFoundException('Não é possível excluir transações vinculadas a checkouts');
        }
        return this.prisma.financialTransaction.delete({ where: { id } });
    }
    async getDailyCashFlow(date) {
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
        const serviceCount = checkouts.reduce((sum, c) => sum + c.services.length, 0);
        const productCount = checkouts.reduce((sum, c) => sum + c.products.reduce((s, p) => s + p.quantity, 0), 0);
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
    async getWeeklyCashFlow(startDate) {
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
        const totals = days.reduce((acc, day) => ({
            income: acc.income + day.income,
            expense: acc.expense + day.expense,
            balance: acc.balance + day.balance,
            serviceCount: acc.serviceCount + day.serviceCount,
            productCount: acc.productCount + day.productCount,
            clientCount: acc.clientCount + day.clientCount,
            checkoutCount: acc.checkoutCount + day.checkoutCount,
        }), {
            income: 0,
            expense: 0,
            balance: 0,
            serviceCount: 0,
            productCount: 0,
            clientCount: 0,
            checkoutCount: 0,
        });
        return {
            startDate,
            endDate: end.toISOString().split('T')[0],
            days,
            totals,
        };
    }
    async getMonthlyCashFlow(year, month) {
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
        const byCategory = transactions.reduce((acc, t) => {
            if (!acc[t.category]) {
                acc[t.category] = { income: 0, expense: 0 };
            }
            if (t.type === 'INCOME') {
                acc[t.category].income += Number(t.amount);
            }
            else {
                acc[t.category].expense += Number(t.amount);
            }
            return acc;
        }, {});
        const byDay = transactions.reduce((acc, t) => {
            const day = t.date.toISOString().split('T')[0];
            if (!acc[day]) {
                acc[day] = { income: 0, expense: 0 };
            }
            if (t.type === 'INCOME') {
                acc[day].income += Number(t.amount);
            }
            else {
                acc[day].expense += Number(t.amount);
            }
            return acc;
        }, {});
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
    async getReportByBarber(startDate, endDate) {
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
        const barberStats = checkouts.reduce((acc, checkout) => {
            const barberId = checkout.barberId;
            if (!acc[barberId]) {
                acc[barberId] = {
                    barber: checkout.barber,
                    totalRevenue: 0,
                    serviceCount: 0,
                    checkoutCount: 0,
                    services: {},
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
        }, {});
        return Object.values(barberStats).map((stat) => ({
            ...stat,
            services: Object.values(stat.services),
            averageTicket: stat.checkoutCount > 0 ? stat.totalRevenue / stat.checkoutCount : 0,
        }));
    }
    async getReportByClient(startDate, endDate) {
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
        const clientStats = checkouts.reduce((acc, checkout) => {
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
        }, {});
        return Object.values(clientStats)
            .map((stat) => ({
            ...stat,
            averageTicket: stat.visitCount > 0 ? stat.totalSpent / stat.visitCount : 0,
        }))
            .sort((a, b) => b.totalSpent - a.totalSpent);
    }
    async getReportByService(startDate, endDate) {
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
        const serviceStats = checkoutServices.reduce((acc, cs) => {
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
        }, {});
        return Object.values(serviceStats).sort((a, b) => b.revenue - a.revenue);
    }
    async getDashboardStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const todayCheckouts = await this.prisma.checkout.findMany({
            where: {
                status: 'COMPLETED',
                createdAt: { gte: today, lt: tomorrow },
            },
        });
        const todayRevenue = todayCheckouts.reduce((sum, c) => sum + Number(c.total), 0);
        const monthCheckouts = await this.prisma.checkout.findMany({
            where: {
                status: 'COMPLETED',
                createdAt: { gte: startOfMonth },
            },
        });
        const monthRevenue = monthCheckouts.reduce((sum, c) => sum + Number(c.total), 0);
        const monthExpenses = await this.prisma.financialTransaction.findMany({
            where: {
                type: 'EXPENSE',
                date: { gte: startOfMonth },
            },
        });
        const totalExpenses = monthExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
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
        const lowStockProducts = await this.prisma.product.findMany({
            where: { isActive: true },
        });
        const lowStockCount = lowStockProducts.filter((p) => p.quantity <= p.minQuantity).length;
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
};
exports.FinancialService = FinancialService;
exports.FinancialService = FinancialService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinancialService);
//# sourceMappingURL=financial.service.js.map