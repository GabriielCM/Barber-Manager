import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';

@Injectable()
export class BarbersService {
  constructor(private prisma: PrismaService) {}

  async create(createBarberDto: CreateBarberDto) {
    return this.prisma.barber.create({
      data: createBarberDto,
    });
  }

  async findAll(onlyActive: boolean = false) {
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

  async findOne(id: string) {
    const barber = await this.prisma.barber.findUnique({
      where: { id },
      include: {
        services: {
          include: { service: true },
        },
      },
    });

    if (!barber) {
      throw new NotFoundException('Barbeiro não encontrado');
    }

    return barber;
  }

  async update(id: string, updateBarberDto: UpdateBarberDto) {
    await this.findOne(id);

    return this.prisma.barber.update({
      where: { id },
      data: updateBarberDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete
    return this.prisma.barber.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async assignService(barberId: string, serviceId: string) {
    await this.findOne(barberId);

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
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

  async removeService(barberId: string, serviceId: string) {
    return this.prisma.barberService.deleteMany({
      where: {
        barberId,
        serviceId,
      },
    });
  }

  async getDashboard(barberId: string, startDate?: Date, endDate?: Date) {
    const barber = await this.findOne(barberId);

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = startDate;
      if (endDate) dateFilter.createdAt.lte = endDate;
    }

    // Buscar checkouts do barbeiro
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

    // Calcular estatísticas
    const totalRevenue = checkouts.reduce(
      (sum, c) => sum + Number(c.total),
      0,
    );
    const totalAppointments = checkouts.length;
    const averageTicket =
      totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

    // Serviços mais executados
    const serviceCount: Record<string, { name: string; count: number; revenue: number }> = {};
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

    // Estatísticas mensais
    const monthlyStats = checkouts.reduce(
      (acc, checkout) => {
        const month = checkout.createdAt.toISOString().slice(0, 7);
        if (!acc[month]) {
          acc[month] = { revenue: 0, count: 0 };
        }
        acc[month].revenue += Number(checkout.total);
        acc[month].count++;
        return acc;
      },
      {} as Record<string, { revenue: number; count: number }>,
    );

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

  async getAvailableBarbers(date: Date, serviceId?: string) {
    const where: any = { isActive: true };

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
        end: new Date(a.date.getTime() + (a.service?.duration || 60) * 60000),
      })),
    }));
  }

  async getPendingAppointments(barberId: string) {
    await this.findOne(barberId);

    const now = new Date();

    const [appointments, subscriptions] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          barberId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          date: { gte: now },
        },
        include: {
          client: true,
          service: true,
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.subscription.findMany({
        where: {
          barberId,
          status: { in: ['ACTIVE', 'PAUSED'] },
        },
        include: {
          client: true,
          package: true,
          service: true,
        },
      }),
    ]);

    return { appointments, subscriptions };
  }

  async deactivateWithAction(
    barberId: string,
    action: 'transfer' | 'cancel',
    targetBarberId?: string,
  ) {
    const barber = await this.findOne(barberId);

    if (action === 'transfer') {
      if (!targetBarberId) {
        throw new BadRequestException(
          'É necessário informar o barbeiro de destino para transferência',
        );
      }

      const targetBarber = await this.prisma.barber.findUnique({
        where: { id: targetBarberId },
      });

      if (!targetBarber || !targetBarber.isActive) {
        throw new NotFoundException('Barbeiro de destino não encontrado ou inativo');
      }

      if (targetBarberId === barberId) {
        throw new BadRequestException('Não pode transferir para o mesmo barbeiro');
      }
    }

    const { appointments: pendingAppointments, subscriptions: activeSubscriptions } =
      await this.getPendingAppointments(barberId);

    // Execute in transaction
    return this.prisma.$transaction(async (tx) => {
      let subscriptionsAffected = 0;

      if (action === 'transfer' && targetBarberId) {
        // Transfer all pending appointments to target barber
        await tx.appointment.updateMany({
          where: {
            barberId,
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
            date: { gte: new Date() },
          },
          data: { barberId: targetBarberId },
        });

        // Transfer all active subscriptions to target barber
        const subscriptionResult = await tx.subscription.updateMany({
          where: {
            barberId,
            status: { in: ['ACTIVE', 'PAUSED'] },
          },
          data: { barberId: targetBarberId },
        });
        subscriptionsAffected = subscriptionResult.count;
      } else if (action === 'cancel') {
        // Cancel all pending appointments
        await tx.appointment.updateMany({
          where: {
            barberId,
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
            date: { gte: new Date() },
          },
          data: { status: 'CANCELLED' },
        });

        // Cancel all active subscriptions
        const subscriptionResult = await tx.subscription.updateMany({
          where: {
            barberId,
            status: { in: ['ACTIVE', 'PAUSED'] },
          },
          data: { status: 'CANCELLED' },
        });
        subscriptionsAffected = subscriptionResult.count;
      }

      // Deactivate the barber
      const deactivatedBarber = await tx.barber.update({
        where: { id: barberId },
        data: { isActive: false },
      });

      return {
        barber: deactivatedBarber,
        appointmentsAffected: pendingAppointments.length,
        subscriptionsAffected,
        action,
        targetBarberId: action === 'transfer' ? targetBarberId : undefined,
      };
    });
  }
}
