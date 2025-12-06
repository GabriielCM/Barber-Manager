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
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const update_appointment_dto_1 = require("./dto/update-appointment.dto");
let AppointmentsService = class AppointmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createAppointmentDto) {
        const client = await this.prisma.client.findUnique({
            where: { id: createAppointmentDto.clientId },
        });
        if (!client) {
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        if (client.status === 'BANNED') {
            throw new common_1.BadRequestException('Cliente está banido e não pode agendar');
        }
        if (client.status === 'DEFAULTER') {
            throw new common_1.BadRequestException('Cliente está marcado como inadimplente. Verifique antes de agendar.');
        }
        const barber = await this.prisma.barber.findUnique({
            where: { id: createAppointmentDto.barberId },
        });
        if (!barber || !barber.isActive) {
            throw new common_1.NotFoundException('Barbeiro não encontrado ou inativo');
        }
        const service = await this.prisma.service.findUnique({
            where: { id: createAppointmentDto.serviceId },
        });
        if (!service || !service.isActive) {
            throw new common_1.NotFoundException('Serviço não encontrado ou inativo');
        }
        const appointmentDate = new Date(createAppointmentDto.date);
        const endTime = new Date(appointmentDate.getTime() + service.duration * 60000);
        const conflictingAppointment = await this.prisma.appointment.findFirst({
            where: {
                barberId: createAppointmentDto.barberId,
                status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
                date: {
                    lt: endTime,
                },
                AND: {
                    date: {
                        gte: new Date(appointmentDate.getTime() - 120 * 60000),
                    },
                },
            },
            include: { service: true },
        });
        if (conflictingAppointment) {
            const conflictEnd = new Date(conflictingAppointment.date.getTime() +
                conflictingAppointment.service.duration * 60000);
            if (appointmentDate < conflictEnd && endTime > conflictingAppointment.date) {
                throw new common_1.BadRequestException('Barbeiro já possui agendamento neste horário');
            }
        }
        return this.prisma.appointment.create({
            data: {
                ...createAppointmentDto,
                date: appointmentDate,
            },
            include: {
                client: true,
                barber: true,
                service: true,
            },
        });
    }
    async findAll(params) {
        const { skip = 0, take = 50, date, barberId, clientId, status } = params || {};
        const where = {};
        if (date) {
            const startOfDay = new Date(date + 'T00:00:00');
            const endOfDay = new Date(date + 'T23:59:59.999');
            where.date = {
                gte: startOfDay,
                lte: endOfDay,
            };
        }
        if (barberId)
            where.barberId = barberId;
        if (clientId)
            where.clientId = clientId;
        if (status)
            where.status = status;
        const [appointments, total] = await Promise.all([
            this.prisma.appointment.findMany({
                where,
                skip,
                take,
                include: {
                    client: true,
                    barber: true,
                    service: true,
                    checkout: true,
                },
                orderBy: { date: 'asc' },
            }),
            this.prisma.appointment.count({ where }),
        ]);
        return { appointments, total };
    }
    async findOne(id) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id },
            include: {
                client: {
                    include: {
                        appointments: {
                            where: { status: 'COMPLETED' },
                            orderBy: { date: 'desc' },
                            take: 5,
                            include: {
                                service: true,
                                barber: true,
                            },
                        },
                        checkouts: {
                            where: { status: 'COMPLETED' },
                            orderBy: { createdAt: 'desc' },
                            take: 5,
                            include: {
                                services: { include: { service: true } },
                                products: { include: { product: true } },
                            },
                        },
                    },
                },
                barber: true,
                service: true,
                checkout: {
                    include: {
                        services: { include: { service: true } },
                        products: { include: { product: true } },
                    },
                },
            },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Agendamento não encontrado');
        }
        return appointment;
    }
    async update(id, updateAppointmentDto) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Agendamento não encontrado');
        }
        if (updateAppointmentDto.status === update_appointment_dto_1.AppointmentStatus.NO_SHOW) {
            await this.prisma.client.update({
                where: { id: appointment.clientId },
                data: { noShowCount: { increment: 1 } },
            });
        }
        return this.prisma.appointment.update({
            where: { id },
            data: {
                ...updateAppointmentDto,
                date: updateAppointmentDto.date
                    ? new Date(updateAppointmentDto.date)
                    : undefined,
            },
            include: {
                client: true,
                barber: true,
                service: true,
            },
        });
    }
    async cancel(id) {
        await this.findOne(id);
        return this.prisma.appointment.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
    }
    async startAppointment(id) {
        await this.findOne(id);
        return this.prisma.appointment.update({
            where: { id },
            data: { status: 'IN_PROGRESS' },
        });
    }
    async getTodayAppointments() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.prisma.appointment.findMany({
            where: {
                date: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            include: {
                client: true,
                barber: true,
                service: true,
                checkout: true,
            },
            orderBy: { date: 'asc' },
        });
    }
    async getUpcomingAppointments(barberId) {
        const now = new Date();
        const where = {
            date: { gte: now },
            status: 'SCHEDULED',
        };
        if (barberId)
            where.barberId = barberId;
        return this.prisma.appointment.findMany({
            where,
            include: {
                client: true,
                barber: true,
                service: true,
            },
            orderBy: { date: 'asc' },
            take: 20,
        });
    }
    async getCalendarView(startDate, endDate, barberId) {
        const where = {
            date: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
        };
        if (barberId)
            where.barberId = barberId;
        const appointments = await this.prisma.appointment.findMany({
            where,
            include: {
                client: true,
                barber: true,
                service: true,
            },
            orderBy: { date: 'asc' },
        });
        const groupedByDay = appointments.reduce((acc, appointment) => {
            const day = appointment.date.toISOString().split('T')[0];
            if (!acc[day])
                acc[day] = [];
            acc[day].push(appointment);
            return acc;
        }, {});
        return groupedByDay;
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map