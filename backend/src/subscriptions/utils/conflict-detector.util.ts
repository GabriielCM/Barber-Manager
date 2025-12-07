import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingAppointment?: any;
}

@Injectable()
export class ConflictDetector {
  constructor(private prisma: PrismaService) {}

  /**
   * Verifica se um único agendamento tem conflito de horário
   */
  async checkSingleAppointmentConflict(
    barberId: string,
    appointmentDate: Date,
    serviceDuration: number,
    excludeAppointmentId?: string,
  ): Promise<ConflictCheckResult> {
    const endTime = new Date(
      appointmentDate.getTime() + serviceDuration * 60000,
    );

    const where: any = {
      barberId,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      date: {
        lt: endTime,
      },
      AND: {
        date: {
          gte: new Date(appointmentDate.getTime() - 120 * 60000), // 2 horas antes
        },
      },
    };

    if (excludeAppointmentId) {
      where.id = { not: excludeAppointmentId };
    }

    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where,
      include: {
        service: true,
        client: true,
      },
    });

    if (!conflictingAppointment) {
      return { hasConflict: false };
    }

    const conflictEnd = new Date(
      conflictingAppointment.date.getTime() +
        (conflictingAppointment.service?.duration || 60) * 60000,
    );

    // Verifica se há sobreposição de horários
    if (
      appointmentDate < conflictEnd &&
      endTime > conflictingAppointment.date
    ) {
      return {
        hasConflict: true,
        conflictingAppointment,
      };
    }

    return { hasConflict: false };
  }

  /**
   * Verifica conflitos para múltiplas datas de agendamento
   */
  async checkMultipleAppointmentConflicts(
    barberId: string,
    dates: Date[],
    serviceDuration: number,
  ): Promise<Map<number, ConflictCheckResult>> {
    const results = new Map<number, ConflictCheckResult>();

    for (let i = 0; i < dates.length; i++) {
      const result = await this.checkSingleAppointmentConflict(
        barberId,
        dates[i],
        serviceDuration,
      );
      results.set(i, result);
    }

    return results;
  }

  /**
   * Valida que o cliente não tem assinatura ativa (limite de 1 por cliente)
   */
  async validateClientHasNoActiveSubscription(
    clientId: string,
  ): Promise<boolean> {
    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        clientId,
        status: 'ACTIVE',
      },
    });

    return !activeSubscription;
  }
}
