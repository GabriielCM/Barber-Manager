import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSubscriptionDto,
  SubscriptionPlanType,
} from './dto/create-subscription.dto';
import {
  PreviewSubscriptionDto,
  SubscriptionPreviewResponse,
  AppointmentPreview,
} from './dto/preview-subscription.dto';
import {
  UpdateSubscriptionDto,
  PauseSubscriptionDto,
  CancelSubscriptionDto,
} from './dto/update-subscription.dto';
import { AdjustAppointmentsDto } from './dto/adjust-appointments.dto';
import { DateCalculator } from './utils/date-calculator.util';
import { ConflictDetector } from './utils/conflict-detector.util';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private conflictDetector: ConflictDetector,
  ) {}

  /**
   * Calcula a duração total de uma assinatura baseado no pacote ou serviço
   * @param subscription - Assinatura com package ou service incluído
   * @returns Duração total em minutos
   */
  private async getSubscriptionDuration(subscriptionId: string): Promise<number> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
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
        service: true,
      },
    });

    if (!subscription) {
      return 60; // Fallback padrão
    }

    // Se tem pacote, soma duração de todos os serviços
    if (subscription.package && subscription.package.services.length > 0) {
      return subscription.package.services.reduce(
        (sum, ps) => sum + (ps.service?.duration || 0),
        0,
      );
    }

    // Se tem serviço único (legacy), usa duração do serviço
    if (subscription.service?.duration) {
      return subscription.service.duration;
    }

    // Fallback
    return 60;
  }

  /**
   * Gera prévia da assinatura com detecção de conflitos
   */
  async previewSubscription(
    dto: PreviewSubscriptionDto,
  ): Promise<SubscriptionPreviewResponse> {
    // Validar que cliente não tem assinatura ativa
    const canCreate =
      await this.conflictDetector.validateClientHasNoActiveSubscription(
        dto.clientId,
      );

    if (!canCreate) {
      throw new ConflictException(
        'Cliente já possui uma assinatura ativa. Apenas uma assinatura ativa por cliente é permitida.',
      );
    }

    // Buscar entidades
    const [client, barber, pkg] = await Promise.all([
      this.prisma.client.findUnique({ where: { id: dto.clientId } }),
      this.prisma.barber.findUnique({ where: { id: dto.barberId } }),
      this.prisma.package.findUnique({
        where: { id: dto.packageId },
        include: {
          services: {
            include: {
              service: true,
            },
          },
        },
      }),
    ]);

    if (!client) throw new NotFoundException('Cliente não encontrado');
    if (!barber || !barber.isActive) {
      throw new NotFoundException('Barbeiro não encontrado ou inativo');
    }
    if (!pkg || !pkg.isActive) {
      throw new NotFoundException('Pacote não encontrado ou inativo');
    }

    // Calcular duração total do pacote (soma de todos os serviços)
    const totalDuration = pkg.services.reduce(
      (sum, ps) => sum + ps.service.duration,
      0,
    );

    // Calcular detalhes da assinatura
    const startDate = new Date(dto.startDate);
    const intervalDays = DateCalculator.getIntervalDays(
      pkg.planType as any as SubscriptionPlanType,
    );
    const endDate = DateCalculator.calculateEndDate(
      startDate,
      dto.durationMonths,
    );
    const totalSlots = DateCalculator.calculateTotalSlots(
      startDate,
      endDate,
      intervalDays,
    );

    // Gerar datas dos agendamentos
    const appointmentDates = DateCalculator.generateAppointmentDates(
      startDate,
      totalSlots,
      intervalDays,
    );

    // Verificar conflitos usando duração total do pacote
    const conflictResults =
      await this.conflictDetector.checkMultipleAppointmentConflicts(
        dto.barberId,
        appointmentDates,
        totalDuration,
      );

    // Construir prévia
    const appointments: AppointmentPreview[] = appointmentDates.map(
      (date, index) => {
        const conflictResult = conflictResults.get(index);

        return {
          slotIndex: index,
          date,
          barberId: barber.id,
          barberName: barber.name,
          serviceId: pkg.id,
          serviceName: pkg.name,
          duration: totalDuration,
          hasConflict: conflictResult?.hasConflict || false,
          conflictDetails: conflictResult?.hasConflict
            ? {
                existingAppointmentId:
                  conflictResult.conflictingAppointment.id,
                existingClientName:
                  conflictResult.conflictingAppointment.client.name,
                existingStartTime: conflictResult.conflictingAppointment.date,
                existingEndTime: new Date(
                  conflictResult.conflictingAppointment.date.getTime() +
                    (conflictResult.conflictingAppointment.service?.duration ||
                      60) *
                      60000,
                ),
              }
            : undefined,
        };
      },
    );

    const hasAnyConflict = appointments.some((a) => a.hasConflict);
    const conflictCount = appointments.filter((a) => a.hasConflict).length;

    return {
      subscription: {
        planType: pkg.planType,
        startDate,
        endDate,
        durationMonths: dto.durationMonths,
        totalSlots,
        intervalDays,
      },
      appointments,
      hasAnyConflict,
      conflictCount,
    };
  }

  /**
   * Cria assinatura após confirmação do usuário (com ajustes opcionais)
   */
  async createSubscription(
    dto: CreateSubscriptionDto,
    adjustments?: AdjustAppointmentsDto,
  ) {
    // Re-validar (prevenir race conditions)
    const canCreate =
      await this.conflictDetector.validateClientHasNoActiveSubscription(
        dto.clientId,
      );

    if (!canCreate) {
      throw new ConflictException('Cliente já possui uma assinatura ativa.');
    }

    // Gerar prévia para validar e obter datas
    const preview = await this.previewSubscription(dto);

    // Aplicar ajustes se fornecidos
    let finalAppointmentDates = preview.appointments.map((a) => a.date);
    if (adjustments?.adjustments) {
      for (const adjustment of adjustments.adjustments) {
        finalAppointmentDates[adjustment.slotIndex] = new Date(
          adjustment.newDate,
        );
      }
    }

    // Re-checar conflitos nas datas ajustadas
    const pkg = await this.prisma.package.findUnique({
      where: { id: dto.packageId },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundException('Pacote não encontrado');
    }

    // Calcular duração total
    const totalDuration = pkg.services.reduce(
      (sum, ps) => sum + ps.service.duration,
      0,
    );

    const finalConflicts =
      await this.conflictDetector.checkMultipleAppointmentConflicts(
        dto.barberId,
        finalAppointmentDates,
        totalDuration,
      );

    const hasConflicts = Array.from(finalConflicts.values()).some(
      (c) => c.hasConflict,
    );
    if (hasConflicts) {
      throw new BadRequestException(
        'Ainda existem conflitos nas datas ajustadas. Por favor, ajuste as datas conflitantes.',
      );
    }

    // Criar assinatura e agendamentos em transação
    const subscription = await this.prisma.$transaction(async (tx) => {
      // Criar assinatura
      const newSubscription = await tx.subscription.create({
        data: {
          clientId: dto.clientId,
          barberId: dto.barberId,
          packageId: dto.packageId,
          planType: pkg.planType,
          startDate: preview.subscription.startDate,
          endDate: preview.subscription.endDate,
          durationMonths: dto.durationMonths,
          totalSlots: preview.subscription.totalSlots,
          notes: dto.notes,
        },
        include: {
          client: true,
          barber: true,
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
      });

      // Criar todos os agendamentos com múltiplos serviços
      for (let index = 0; index < finalAppointmentDates.length; index++) {
        const date = finalAppointmentDates[index];

        // Criar agendamento
        const appointment = await tx.appointment.create({
          data: {
            clientId: dto.clientId,
            barberId: dto.barberId,
            serviceId: null, // Não usa mais serviceId único
            subscriptionId: newSubscription.id,
            isSubscriptionBased: true,
            subscriptionSlotIndex: index,
            date,
            status: 'SCHEDULED',
          },
        });

        // Criar AppointmentService para cada serviço do pacote
        await tx.appointmentService.createMany({
          data: pkg.services.map((ps) => ({
            appointmentId: appointment.id,
            serviceId: ps.serviceId,
          })),
        });
      }

      // Criar log de criação
      await tx.subscriptionChangeLog.create({
        data: {
          subscriptionId: newSubscription.id,
          changeType: 'CREATED',
          description: `Assinatura criada com ${preview.subscription.totalSlots} agendamentos (${pkg.planType})`,
          newValue: {
            planType: pkg.planType,
            packageId: dto.packageId,
            packageName: pkg.name,
            startDate: preview.subscription.startDate,
            endDate: preview.subscription.endDate,
            totalSlots: preview.subscription.totalSlots,
          },
        },
      });

      // Logar ajustes se houver
      if (adjustments?.adjustments) {
        for (const adjustment of adjustments.adjustments) {
          await tx.subscriptionChangeLog.create({
            data: {
              subscriptionId: newSubscription.id,
              changeType: 'APPOINTMENT_ADJUSTED',
              description: `Agendamento #${adjustment.slotIndex} ajustado durante criação`,
              oldValue: { date: preview.appointments[adjustment.slotIndex].date },
              newValue: { date: adjustment.newDate },
              reason: adjustment.reason,
            },
          });
        }
      }

      return newSubscription;
    });

    // Emitir evento para notificações
    this.eventEmitter.emit('subscription.created', {
      subscriptionId: subscription.id,
      clientId: subscription.clientId,
      clientName: subscription.client.name,
      clientPhone: subscription.client.phone,
      barberId: subscription.barberId,
      barberName: subscription.barber.name,
      totalSlots: subscription.totalSlots,
      planType: subscription.planType,
    });

    return this.findOne(subscription.id);
  }

  /**
   * Lista todas as assinaturas com filtros
   */
  async findAll(params?: {
    skip?: number;
    take?: number;
    clientId?: string;
    barberId?: string;
    status?: string;
  }) {
    const { skip = 0, take = 50, clientId, barberId, status } = params || {};

    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (barberId) where.barberId = barberId;
    if (status) where.status = status;

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take,
        include: {
          client: true,
          barber: true,
          service: true,
          appointments: {
            where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
            orderBy: { date: 'asc' },
          },
          _count: {
            select: {
              appointments: {
                where: { status: 'COMPLETED' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    // Calcular completedSlots do count
    const subscriptionsWithProgress = subscriptions.map((sub) => ({
      ...sub,
      completedSlots: sub._count.appointments,
    }));

    return { subscriptions: subscriptionsWithProgress, total };
  }

  /**
   * Busca uma assinatura por ID
   */
  async findOne(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        client: true,
        barber: true,
        service: true,
        appointments: {
          orderBy: { subscriptionSlotIndex: 'asc' },
        },
        changeLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    return subscription;
  }

  /**
   * Atualiza assinatura (mudar plano ou observações)
   */
  async updateSubscription(id: string, dto: UpdateSubscriptionDto) {
    const subscription = await this.findOne(id);

    if (subscription.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Apenas assinaturas ativas podem ser editadas',
      );
    }

    // Se mudar planType, recalcular agendamentos futuros
    if (dto.planType && dto.planType !== subscription.planType) {
      return this.changePlanType(id, dto.planType, dto.reason);
    }

    // Senão, apenas atualizar notes
    return this.prisma.subscription.update({
      where: { id },
      data: {
        notes: dto.notes,
      },
      include: {
        client: true,
        barber: true,
        service: true,
        appointments: true,
      },
    });
  }

  /**
   * Muda o tipo de plano e recalcula agendamentos futuros
   */
  async changePlanType(
    id: string,
    newPlanType: SubscriptionPlanType,
    reason?: string,
  ) {
    const subscription = await this.findOne(id);

    // Pegar apenas agendamentos futuros
    const futureAppointments = subscription.appointments.filter(
      (apt) => apt.status === 'SCHEDULED' || apt.status === 'IN_PROGRESS',
    );

    if (futureAppointments.length === 0) {
      throw new BadRequestException(
        'Não há agendamentos futuros para recalcular',
      );
    }

    // Primeira data futura como nova data inicial
    const newStartDate = new Date(
      Math.min(...futureAppointments.map((a) => a.date.getTime())),
    );

    // Calcular novas datas
    const newIntervalDays = DateCalculator.getIntervalDays(newPlanType);
    const newDates = DateCalculator.generateAppointmentDates(
      newStartDate,
      futureAppointments.length,
      newIntervalDays,
    );

    // Obter duração correta (do pacote ou serviço)
    const subscriptionDuration = await this.getSubscriptionDuration(id);

    // Verificar conflitos
    const conflictResults =
      await this.conflictDetector.checkMultipleAppointmentConflicts(
        subscription.barberId,
        newDates,
        subscriptionDuration,
      );

    const hasConflicts = Array.from(conflictResults.values()).some(
      (c) => c.hasConflict,
    );
    if (hasConflicts) {
      throw new BadRequestException(
        'As novas datas geradas possuem conflitos. Por favor, ajuste manualmente ou escolha outro plano.',
      );
    }

    // Atualizar em transação
    await this.prisma.$transaction(async (tx) => {
      // Atualizar subscription
      await tx.subscription.update({
        where: { id },
        data: {
          planType: newPlanType,
        },
      });

      // Atualizar agendamentos futuros com novas datas
      for (let i = 0; i < futureAppointments.length; i++) {
        await tx.appointment.update({
          where: { id: futureAppointments[i].id },
          data: { date: newDates[i] },
        });
      }

      // Logar mudança
      await tx.subscriptionChangeLog.create({
        data: {
          subscriptionId: id,
          changeType: 'PLAN_CHANGED',
          description: `Plano alterado de ${subscription.planType} para ${newPlanType}`,
          oldValue: { planType: subscription.planType },
          newValue: { planType: newPlanType },
          reason,
        },
      });
    });

    return this.findOne(id);
  }

  /**
   * Pausa uma assinatura
   */
  async pauseSubscription(id: string, dto: PauseSubscriptionDto) {
    const subscription = await this.findOne(id);

    if (subscription.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Apenas assinaturas ativas podem ser pausadas',
      );
    }

    // Cancelar todos agendamentos futuros
    const futureAppointments = subscription.appointments.filter(
      (apt) => apt.status === 'SCHEDULED' && apt.date > new Date(),
    );

    await this.prisma.$transaction(async (tx) => {
      // Atualizar subscription
      await tx.subscription.update({
        where: { id },
        data: {
          status: 'PAUSED',
          pausedAt: new Date(),
        },
      });

      // Cancelar agendamentos futuros
      for (const apt of futureAppointments) {
        await tx.appointment.update({
          where: { id: apt.id },
          data: { status: 'CANCELLED' },
        });
      }

      // Logar
      await tx.subscriptionChangeLog.create({
        data: {
          subscriptionId: id,
          changeType: 'PAUSED',
          description: `Assinatura pausada. ${futureAppointments.length} agendamentos futuros cancelados.`,
          reason: dto.reason,
        },
      });
    });

    this.eventEmitter.emit('subscription.paused', {
      subscriptionId: id,
      clientId: subscription.clientId,
    });

    return this.findOne(id);
  }

  /**
   * Retoma uma assinatura pausada
   */
  async resumeSubscription(id: string, newStartDate: string, reason?: string) {
    const subscription = await this.findOne(id);

    if (subscription.status !== 'PAUSED') {
      throw new BadRequestException(
        'Apenas assinaturas pausadas podem ser retomadas',
      );
    }

    // Calcular slots restantes
    const completedCount = subscription.appointments.filter(
      (apt) => apt.status === 'COMPLETED',
    ).length;
    const remainingSlots = subscription.totalSlots - completedCount;

    if (remainingSlots <= 0) {
      throw new BadRequestException('Não há slots restantes para retomar');
    }

    // Buscar pacote com serviços (se existir)
    const pkg = subscription.packageId
      ? await this.prisma.package.findUnique({
          where: { id: subscription.packageId },
          include: {
            services: {
              include: {
                service: true,
              },
            },
          },
        })
      : null;

    // Obter duração correta
    const subscriptionDuration = await this.getSubscriptionDuration(id);

    // Gerar novas datas
    const startDate = new Date(newStartDate);
    const intervalDays = DateCalculator.getIntervalDays(
      subscription.planType as SubscriptionPlanType,
    );
    const newDates = DateCalculator.generateAppointmentDates(
      startDate,
      remainingSlots,
      intervalDays,
    );

    // Verificar conflitos com duração correta
    const conflictResults =
      await this.conflictDetector.checkMultipleAppointmentConflicts(
        subscription.barberId,
        newDates,
        subscriptionDuration,
      );

    const hasConflicts = Array.from(conflictResults.values()).some(
      (c) => c.hasConflict,
    );
    if (hasConflicts) {
      throw new BadRequestException(
        'As novas datas possuem conflitos. Por favor, escolha outra data de início.',
      );
    }

    // Retomar em transação
    await this.prisma.$transaction(async (tx) => {
      // Deletar agendamentos cancelados
      await tx.appointment.deleteMany({
        where: {
          subscriptionId: id,
          status: 'CANCELLED',
        },
      });

      // Criar novos agendamentos
      for (let i = 0; i < remainingSlots; i++) {
        const appointment = await tx.appointment.create({
          data: {
            clientId: subscription.clientId,
            barberId: subscription.barberId,
            serviceId: null, // Não usa mais serviceId único para pacotes
            subscriptionId: id,
            isSubscriptionBased: true,
            subscriptionSlotIndex: completedCount + i,
            date: newDates[i],
            status: 'SCHEDULED',
          },
        });

        // Criar AppointmentService para cada serviço do pacote (se houver pacote)
        if (pkg && pkg.services.length > 0) {
          await tx.appointmentService.createMany({
            data: pkg.services.map((ps) => ({
              appointmentId: appointment.id,
              serviceId: ps.serviceId,
            })),
          });
        }
      }

      // Atualizar subscription
      await tx.subscription.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          pausedAt: null,
        },
      });

      // Logar
      await tx.subscriptionChangeLog.create({
        data: {
          subscriptionId: id,
          changeType: 'RESUMED',
          description: `Assinatura retomada com ${remainingSlots} agendamentos restantes`,
          newValue: { newStartDate, remainingSlots },
          reason,
        },
      });
    });

    this.eventEmitter.emit('subscription.resumed', {
      subscriptionId: id,
      clientId: subscription.clientId,
    });

    return this.findOne(id);
  }

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(id: string, dto: CancelSubscriptionDto) {
    const subscription = await this.findOne(id);

    if (subscription.status === 'CANCELLED') {
      throw new BadRequestException('Assinatura já está cancelada');
    }

    // Cancelar todos agendamentos futuros
    const futureAppointments = subscription.appointments.filter(
      (apt) =>
        (apt.status === 'SCHEDULED' || apt.status === 'IN_PROGRESS') &&
        apt.date > new Date(),
    );

    await this.prisma.$transaction(async (tx) => {
      // Atualizar subscription
      await tx.subscription.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: dto.reason,
        },
      });

      // Cancelar agendamentos futuros
      for (const apt of futureAppointments) {
        await tx.appointment.update({
          where: { id: apt.id },
          data: { status: 'CANCELLED' },
        });
      }

      // Logar
      await tx.subscriptionChangeLog.create({
        data: {
          subscriptionId: id,
          changeType: 'CANCELLED',
          description: `Assinatura cancelada. ${futureAppointments.length} agendamentos futuros cancelados.`,
          reason: dto.reason,
        },
      });
    });

    this.eventEmitter.emit('subscription.cancelled', {
      subscriptionId: id,
      clientId: subscription.clientId,
      reason: dto.reason,
    });

    return this.findOne(id);
  }
}
