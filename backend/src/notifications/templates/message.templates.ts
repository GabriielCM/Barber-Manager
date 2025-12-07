import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * WhatsApp message templates for appointment notifications
 */
export class MessageTemplates {
  /**
   * Appointment created/confirmed message
   */
  static appointmentCreated(data: {
    clientName: string;
    date: Date;
    barberName: string;
    serviceName: string;
  }): string {
    const formattedDate = format(data.date, "dd/MM/yyyy 'às' HH:mm", {
      locale: ptBR,
    });

    return `Olá ${data.clientName}! ✂️\n\n` +
      `Seu agendamento foi confirmado:\n` +
      `📅 ${formattedDate}\n` +
      `💈 Barbeiro: ${data.barberName}\n` +
      `✨ Serviço: ${data.serviceName}\n\n` +
      `Aguardamos você!`;
  }

  /**
   * Morning reminder (sent at 9 AM on appointment day)
   */
  static appointmentReminderMorning(data: {
    clientName: string;
    time: string;
    barberName: string;
  }): string {
    return `Bom dia ${data.clientName}! ☀️\n\n` +
      `Lembrando que você tem agendamento hoje às ${data.time} com ${data.barberName}.\n\n` +
      `Nos vemos em breve!`;
  }

  /**
   * 1 hour before appointment reminder
   */
  static appointmentReminder1Hour(data: {
    clientName: string;
    time: string;
    barberName: string;
  }): string {
    return `Olá ${data.clientName}! ⏰\n\n` +
      `Seu agendamento é daqui a 1 hora (${data.time}) com ${data.barberName}.\n\n` +
      `Até logo!`;
  }

  /**
   * 15 minutes before appointment reminder
   */
  static appointmentReminder15Min(data: {
    clientName: string;
    barberName: string;
  }): string {
    return `${data.clientName}, seu agendamento com ${data.barberName} é em 15 minutos! ⚡\n\n` +
      `Estamos te esperando!`;
  }

  /**
   * Appointment updated message
   */
  static appointmentUpdated(data: {
    clientName: string;
    newDate: Date;
    barberName: string;
    serviceName: string;
  }): string {
    const formattedDate = format(data.newDate, "dd/MM/yyyy 'às' HH:mm", {
      locale: ptBR,
    });

    return `${data.clientName}, seu agendamento foi alterado! 🔄\n\n` +
      `Nova data: ${formattedDate}\n` +
      `Barbeiro: ${data.barberName}\n` +
      `Serviço: ${data.serviceName}\n\n` +
      `Qualquer dúvida, entre em contato!`;
  }

  /**
   * Appointment cancelled message
   */
  static appointmentCancelled(data: {
    clientName: string;
    date: Date;
  }): string {
    const formattedDate = format(data.date, "dd/MM/yyyy 'às' HH:mm", {
      locale: ptBR,
    });

    return `${data.clientName}, seu agendamento do dia ${formattedDate} foi cancelado. ❌\n\n` +
      `Se precisar reagendar, estamos à disposição!`;
  }

  /**
   * Generic custom message template
   */
  static customMessage(data: {
    clientName: string;
    message: string;
  }): string {
    return `Olá ${data.clientName}!\n\n${data.message}`;
  }
}
