import { SubscriptionPlanType } from '../dto/create-subscription.dto';

/**
 * Quantidade fixa de agendamentos por mês
 * - 1 mês = 4 agendamentos
 * - 3 meses = 12 agendamentos
 * - 6 meses = 24 agendamentos
 */
const SLOTS_PER_MONTH = 4;

export class DateCalculator {
  /**
   * Retorna o intervalo em dias baseado no tipo de plano
   */
  static getIntervalDays(planType: SubscriptionPlanType): number {
    return planType === SubscriptionPlanType.WEEKLY ? 7 : 14;
  }

  /**
   * Calcula a data final baseada na data inicial e duração em meses
   */
  static calculateEndDate(startDate: Date, durationMonths: number): Date {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    return endDate;
  }

  /**
   * Calcula o total de slots (agendamentos) baseado na duração em meses
   * Usa a regra fixa de 4 agendamentos por mês
   */
  static calculateTotalSlots(
    startDate: Date,
    endDate: Date,
    intervalDays: number,
  ): number {
    // Calcular a diferença em meses
    const months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());

    // Regra fixa: 4 agendamentos por mês
    return months * SLOTS_PER_MONTH;
  }

  /**
   * Calcula o total de slots diretamente pela duração em meses
   * Regra: 4 agendamentos por mês
   */
  static calculateSlotsByDuration(durationMonths: number): number {
    return durationMonths * SLOTS_PER_MONTH;
  }

  /**
   * Retorna a quantidade de slots por mês (constante)
   */
  static getSlotsPerMonth(): number {
    return SLOTS_PER_MONTH;
  }

  /**
   * Gera todas as datas de agendamento para uma assinatura
   */
  static generateAppointmentDates(
    startDate: Date,
    totalSlots: number,
    intervalDays: number,
  ): Date[] {
    const dates: Date[] = [];

    for (let i = 0; i < totalSlots; i++) {
      const appointmentDate = new Date(startDate);
      appointmentDate.setDate(appointmentDate.getDate() + i * intervalDays);
      dates.push(appointmentDate);
    }

    return dates;
  }

  /**
   * Recalcula as datas dos agendamentos quando o tipo de plano muda
   */
  static recalculateAppointmentDates(
    originalDates: Date[],
    newPlanType: SubscriptionPlanType,
    startDate: Date,
  ): Date[] {
    const newIntervalDays = this.getIntervalDays(newPlanType);
    return this.generateAppointmentDates(
      startDate,
      originalDates.length,
      newIntervalDays,
    );
  }
}
