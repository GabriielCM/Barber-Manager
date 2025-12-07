import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class SubscriptionEventsListener {
  private readonly logger = new Logger(SubscriptionEventsListener.name);

  constructor(private notificationsService: NotificationsService) {}

  @OnEvent('subscription.created')
  async handleSubscriptionCreated(payload: any) {
    this.logger.log(`Assinatura criada: ${payload.subscriptionId}`);

    // Enviar mensagem de confirmação via WhatsApp
    const message = `Olá ${payload.clientName}! 🎉\n\nSua assinatura ${payload.planType === 'WEEKLY' ? 'semanal' : 'quinzenal'} foi criada com sucesso!\n\nVocê tem ${payload.totalSlots} agendamentos programados com ${payload.barberName}.\n\nObrigado pela preferência!`;

    try {
      await this.notificationsService.createNotification({
        clientId: payload.clientId,
        type: NotificationType.MANUAL_MESSAGE,
        message,
        phoneNumber: payload.clientPhone,
      });
    } catch (error) {
      this.logger.error(
        `Erro ao enviar notificação de assinatura criada: ${error.message}`,
      );
    }
  }

  @OnEvent('subscription.paused')
  async handleSubscriptionPaused(payload: any) {
    this.logger.log(`Assinatura pausada: ${payload.subscriptionId}`);
    // Opcional: enviar notificação sobre pausa
  }

  @OnEvent('subscription.resumed')
  async handleSubscriptionResumed(payload: any) {
    this.logger.log(`Assinatura retomada: ${payload.subscriptionId}`);
    // Opcional: enviar notificação sobre retomada
  }

  @OnEvent('subscription.cancelled')
  async handleSubscriptionCancelled(payload: any) {
    this.logger.log(`Assinatura cancelada: ${payload.subscriptionId}`);
    // Opcional: enviar notificação sobre cancelamento
  }
}
