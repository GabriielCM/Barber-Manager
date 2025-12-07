import { SubscriptionPlanType } from '../dto/create-subscription.dto';

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
   * Calcula o total de slots (agendamentos) dentro do período da assinatura
   */
  static calculateTotalSlots(
    startDate: Date,
    endDate: Date,
    intervalDays: number,
  ): number {
    const totalDays = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return Math.floor(totalDays / intervalDays) + 1; // +1 inclui a data inicial
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
