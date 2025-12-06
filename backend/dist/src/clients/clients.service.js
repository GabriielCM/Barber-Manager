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
exports.ClientsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ClientsService = class ClientsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createClientDto) {
        return this.prisma.client.create({
            data: {
                ...createClientDto,
                birthDate: createClientDto.birthDate
                    ? new Date(createClientDto.birthDate)
                    : null,
            },
        });
    }
    async findAll(params) {
        const { skip = 0, take = 50, search, status } = params || {};
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status) {
            where.status = status;
        }
        const [clients, total] = await Promise.all([
            this.prisma.client.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.client.count({ where }),
        ]);
        return { clients, total };
    }
    async findOne(id) {
        const client = await this.prisma.client.findUnique({
            where: { id },
            include: {
                appointments: {
                    include: {
                        barber: true,
                        service: true,
                    },
                    orderBy: { date: 'desc' },
                    take: 10,
                },
                checkouts: {
                    include: {
                        services: { include: { service: true } },
                        products: { include: { product: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (!client) {
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        return client;
    }
    async getClientHistory(id) {
        const client = await this.prisma.client.findUnique({
            where: { id },
            include: {
                appointments: {
                    include: {
                        barber: true,
                        service: true,
                    },
                    orderBy: { date: 'desc' },
                },
                checkouts: {
                    where: { status: 'COMPLETED' },
                    include: {
                        services: { include: { service: true } },
                        products: { include: { product: true } },
                        barber: true,
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!client) {
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        const completedCheckouts = client.checkouts;
        const totalSpent = completedCheckouts.reduce((sum, c) => sum + Number(c.total), 0);
        const ticketMedio = completedCheckouts.length > 0 ? totalSpent / completedCheckouts.length : 0;
        const now = new Date();
        const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
        const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
        const visitsThisMonth = client.appointments.filter((a) => new Date(a.date) >= oneMonthAgo && a.status === 'COMPLETED').length;
        const visitsThisYear = client.appointments.filter((a) => new Date(a.date) >= oneYearAgo && a.status === 'COMPLETED').length;
        const lastVisit = client.appointments.find((a) => a.status === 'COMPLETED');
        const barbersWhoServed = [
            ...new Set(completedCheckouts.map((c) => c.barber)),
        ];
        const serviceCount = {};
        completedCheckouts.forEach((checkout) => {
            checkout.services.forEach((cs) => {
                if (!serviceCount[cs.serviceId]) {
                    serviceCount[cs.serviceId] = { name: cs.service.name, count: 0 };
                }
                serviceCount[cs.serviceId].count++;
            });
        });
        const topServices = Object.values(serviceCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        const productCount = {};
        completedCheckouts.forEach((checkout) => {
            checkout.products.forEach((cp) => {
                if (!productCount[cp.productId]) {
                    productCount[cp.productId] = { name: cp.product.name, count: 0 };
                }
                productCount[cp.productId].count += cp.quantity;
            });
        });
        const topProducts = Object.values(productCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        return {
            client: {
                id: client.id,
                name: client.name,
                phone: client.phone,
                email: client.email,
                status: client.status,
                createdAt: client.createdAt,
            },
            stats: {
                totalSpent,
                ticketMedio,
                totalVisits: completedCheckouts.length,
                visitsThisMonth,
                visitsThisYear,
                noShowCount: client.noShowCount,
                lastVisit: lastVisit?.date || null,
            },
            barbersWhoServed,
            topServices,
            topProducts,
            recentAppointments: client.appointments.slice(0, 5),
            recentCheckouts: client.checkouts.slice(0, 5),
        };
    }
    async update(id, updateClientDto) {
        await this.findOne(id);
        return this.prisma.client.update({
            where: { id },
            data: {
                ...updateClientDto,
                birthDate: updateClientDto.birthDate
                    ? new Date(updateClientDto.birthDate)
                    : undefined,
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.client.delete({
            where: { id },
        });
    }
    async getVipClients(minTicket = 500) {
        const clients = await this.prisma.client.findMany({
            where: {
                status: 'ACTIVE',
            },
            include: {
                checkouts: {
                    where: { status: 'COMPLETED' },
                },
            },
        });
        const vipClients = clients
            .map((client) => {
            const totalSpent = client.checkouts.reduce((sum, c) => sum + Number(c.total), 0);
            const ticketMedio = client.checkouts.length > 0
                ? totalSpent / client.checkouts.length
                : 0;
            return {
                ...client,
                totalSpent,
                ticketMedio,
                totalVisits: client.checkouts.length,
            };
        })
            .filter((c) => c.ticketMedio >= minTicket)
            .sort((a, b) => b.ticketMedio - a.ticketMedio);
        return vipClients;
    }
    async getInactiveClients(daysInactive = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
        const clients = await this.prisma.client.findMany({
            where: {
                status: 'ACTIVE',
            },
            include: {
                appointments: {
                    where: { status: 'COMPLETED' },
                    orderBy: { date: 'desc' },
                    take: 1,
                },
            },
        });
        return clients.filter((client) => {
            if (client.appointments.length === 0)
                return true;
            return new Date(client.appointments[0].date) < cutoffDate;
        });
    }
    async incrementNoShow(id) {
        return this.prisma.client.update({
            where: { id },
            data: {
                noShowCount: { increment: 1 },
            },
        });
    }
    async updateTotalSpent(id, amount) {
        return this.prisma.client.update({
            where: { id },
            data: {
                totalSpent: { increment: amount },
            },
        });
    }
    async search(query) {
        return this.prisma.client.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query } },
                ],
            },
            take: 10,
        });
    }
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClientsService);
//# sourceMappingURL=clients.service.js.map