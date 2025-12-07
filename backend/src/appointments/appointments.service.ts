import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto, AppointmentStatus } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    // Verificar cliente
    const client = await this.prisma.client.findUnique({
      where: { id: createAppointmentDto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Verificar status do cliente
    if (client.status === 'BANNED') {
      throw new BadRequestException('Cliente está banido e não pode agendar');
    }

    if (client.status === 'DEFAULTER') {
      throw new BadRequestException(
        'Cliente está marcado como inadimplente. Verifique antes de agendar.',
      );
    }

    // Verificar barbeiro
    const barber = await this.prisma.barber.findUnique({
      where: { id: createAppointmentDto.barberId },
    });

    if (!barber || !barber.isActive) {
      throw new NotFoundException('Barbeiro não encontrado ou inativo');
    }

    // Verificar serviço
    const service = await this.prisma.service.findUnique({
      where: { id: createAppointmentDto.serviceId },
    });

    if (!service || !service.isActive) {
      throw new NotFoundException('Serviço não encontrado ou inativo');
    }

    // Verificar conflito de horário
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
            gte: new Date(appointmentDate.getTime() - 120 * 60000), // 2 horas antes
          },
        },
      },
      include: { service: true },
    });

    if (conflictingAppointment) {
      const conflictEnd = new Date(
        conflictingAppointment.date.getTime() +
          (conflictingAppointment.service?.duration || 0) * 60000,
      );

      if (appointmentDate < conflictEnd && endTime > conflictingAppointment.date) {
        throw new BadRequestException(
          'Barbeiro já possui agendamento neste horário',
        );
      }
    }

    const appointment = await this.prisma.appointment.create({
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

    // Emit event for notification system
    this.eventEmitter.emit('appointment.created', {
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      clientName: appointment.client.name,
      clientPhone: appointment.client.phone,
      barberId: appointment.barberId,
      barberName: appointment.barber.name,
      serviceId: appointment.serviceId || '',
      serviceName: appointment.service?.name || 'Pacote de serviços',
      date: appointment.date,
    });

    return appointment;
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    date?: string;
    barberId?: string;
    clientId?: string;
    status?: string;
  }) {
    const { skip = 0, take = 50, date, barberId, clientId, status } = params || {};

    const where: any = {};

    if (date) {
      // Adiciona horário local para evitar problemas de timezone
      const startOfDay = new Date(date + 'T00:00:00');
      const endOfDay = new Date(date + 'T23:59:59.999');

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (barberId) where.barberId = barberId;
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

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

  async findOne(id: string) {
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
        appointmentServices: {
          include: {
            service: true,
          },
        },
        subscription: {
          include: {
            package: {
              include: {
                services: {
                  include: {
                    service: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    // Se marcando como NO_SHOW, incrementar no-show do cliente
    if (updateAppointmentDto.status === AppointmentStatus.NO_SHOW) {
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

  async cancel(id: string) {
    const appointment = await this.findOne(id);

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        client: true,
        barber: true,
        service: true,
      },
    });

    // Emit event for notification system
    // Se for agendamento de assinatura, apenas marcar como cancelado (não afeta assinatura)
    this.eventEmitter.emit('appointment.cancelled', {
      appointmentId: updated.id,
      clientId: updated.clientId,
      clientName: updated.client.name,
      clientPhone: updated.client.phone,
      barberId: updated.barberId,
      barberName: updated.barber.name,
      serviceId: updated.serviceId || '',
      serviceName: updated.service?.name || 'Pacote de serviços',
      date: updated.date,
      isSubscriptionBased: updated.isSubscriptionBased || false,
    });

    return updated;
  }

  async startAppointment(id: string) {
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

  async getUpcomingAppointments(barberId?: string) {
    const now = new Date();

    const where: any = {
      date: { gte: now },
      status: 'SCHEDULED',
    };

    if (barberId) where.barberId = barberId;

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

  async getCalendarView(startDate: string, endDate: string, barberId?: string) {
    const where: any = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (barberId) where.barberId = barberId;

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        client: true,
        barber: true,
        service: true,
      },
      orderBy: { date: 'asc' },
    });

    // Agrupar por dia
    const groupedByDay = appointments.reduce(
      (acc, appointment) => {
        const day = appointment.date.toISOString().split('T')[0];
        if (!acc[day]) acc[day] = [];
        acc[day].push(appointment);
        return acc;
      },
      {} as Record<string, typeof appointments>,
    );

    return groupedByDay;
  }
}
