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
exports.BarbersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BarbersService = class BarbersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createBarberDto) {
        return this.prisma.barber.create({
            data: createBarberDto,
        });
    }
    async findAll(onlyActive = false) {
        const where = onlyActive ? { isActive: true } : {};
        return this.prisma.barber.findMany({
            where,
            include: {
                services: {
                    include: { service: true },
                },
                _count: {
                    select: {
                        appointments: true,
                        checkouts: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id) {
        const barber = await this.prisma.barber.findUnique({
            where: { id },
            include: {
                services: {
                    include: { service: true },
                },
            },
        });
        if (!barber) {
            throw new common_1.NotFoundException('Barbeiro não encontrado');
        }
        return barber;
    }
    async update(id, updateBarberDto) {
        await this.findOne(id);
        return this.prisma.barber.update({
            where: { id },
            data: updateBarberDto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.barber.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async assignService(barberId, serviceId) {
        await this.findOne(barberId);
        const service = await this.prisma.service.findUnique({
            where: { id: serviceId },
        });
        if (!service) {
            throw new common_1.NotFoundException('Serviço não encontrado');
        }
        return this.prisma.barberService.upsert({
            where: {
                barberId_serviceId: {
                    barberId,
                    serviceId,
                },
            },
            update: {},
            create: {
                barberId,
                serviceId,
            },
        });
    }
    async removeService(barberId, serviceId) {
        return this.prisma.barberService.deleteMany({
            where: {
                barberId,
                serviceId,
            },
        });
    }
    async getDashboard(barberId, startDate, endDate) {
        const barber = await this.findOne(barberId);
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate)
                dateFilter.createdAt.gte = startDate;
            if (endDate)
                dateFilter.createdAt.lte = endDate;
        }
        const checkouts = await this.prisma.checkout.findMany({
            where: {
                barberId,
                status: 'COMPLETED',
                ...dateFilter,
            },
            include: {
                services: {
                    include: { service: true },
                },
            },
        });
        const totalRevenue = checkouts.reduce((sum, c) => sum + Number(c.total), 0);
        const totalAppointments = checkouts.length;
        const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;
        const serviceCount = {};
        checkouts.forEach((checkout) => {
            checkout.services.forEach((cs) => {
                if (!serviceCount[cs.serviceId]) {
                    serviceCount[cs.serviceId] = { name: cs.service.name, count: 0, revenue: 0 };
                }
                serviceCount[cs.serviceId].count++;
                serviceCount[cs.serviceId].revenue += Number(cs.price);
            });
        });
        const topServices = Object.values(serviceCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        const monthlyStats = checkouts.reduce((acc, checkout) => {
            const month = checkout.createdAt.toISOString().slice(0, 7);
            if (!acc[month]) {
                acc[month] = { revenue: 0, count: 0 };
            }
            acc[month].revenue += Number(checkout.total);
            acc[month].count++;
            return acc;
        }, {});
        return {
            barber: {
                id: barber.id,
                name: barber.name,
                specialties: barber.specialties,
            },
            stats: {
                totalRevenue,
                totalAppointments,
                averageTicket,
            },
            topServices,
            monthlyStats,
        };
    }
    async getAvailableBarbers(date, serviceId) {
        const where = { isActive: true };
        if (serviceId) {
            where.services = {
                some: { serviceId },
            };
        }
        const barbers = await this.prisma.barber.findMany({
            where,
            include: {
                appointments: {
                    where: {
                        date: {
                            gte: new Date(date.setHours(0, 0, 0, 0)),
                            lt: new Date(date.setHours(23, 59, 59, 999)),
                        },
                        status: {
                            in: ['SCHEDULED', 'IN_PROGRESS'],
                        },
                    },
                    include: { service: true },
                },
            },
        });
        return barbers.map((barber) => ({
            ...barber,
            busySlots: barber.appointments.map((a) => ({
                start: a.date,
                end: new Date(a.date.getTime() + a.service.duration * 60000),
            })),
        }));
    }
};
exports.BarbersService = BarbersService;
exports.BarbersService = BarbersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BarbersService);
//# sourceMappingURL=barbers.service.js.map