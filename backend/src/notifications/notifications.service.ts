import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { NotificationType, NotificationStatus } from '@prisma/client';
import { MessageTemplates } from './templates/message.templates';
import { PhoneUtils } from '../common/utils/phone.utils';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsAppService,
  ) {}

  /**
   * Create a new notification
   */
  async createNotification(data: {
    clientId: string;
    appointmentId?: string;
    type: NotificationType;
    message: string;
    phoneNumber: string;
    scheduledFor?: Date;
  }) {
    try {
      // Ensure phone number is in WhatsApp format
      const whatsappPhone = data.phoneNumber.includes('@c.us')
        ? data.phoneNumber
        : PhoneUtils.toWhatsAppId(data.phoneNumber);

      const notification = await this.prisma.notification.create({
        data: {
          clientId: data.clientId,
          appointmentId: data.appointmentId,
          type: data.type,
          message: data.message,
          phoneNumber: whatsappPhone,
          scheduledFor: data.scheduledFor,
          status: data.scheduledFor
            ? NotificationStatus.SCHEDULED
            : NotificationStatus.PENDING,
        },
        include: {
          client: true,
          appointment: {
            include: {
              barber: true,
              service: true,
            },
          },
        },
      });

      this.logger.log(`Notification created: ${notification.id} (${data.type})`);

      // If not scheduled, send immediately
      if (!data.scheduledFor) {
        await this.processNotification(notification.id);
      }

      return notification;
    } catch (error) {
      this.logger.error('Failed to create notification', error);
      throw error;
    }
  }

  /**
   * Process a pending notification (send it)
   */
  async processNotification(notificationId: string) {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId },
        include: {
          client: true,
        },
      });

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      if (notification.attempts >= notification.maxAttempts) {
        this.logger.warn(`Notification ${notificationId} exceeded max attempts`);
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: NotificationStatus.FAILED,
            errorMessage: 'Max retry attempts exceeded',
          },
        });
        return;
      }

      // Send message via WhatsApp
      const result = await this.whatsappService.sendMessage(
        notification.phoneNumber,
        notification.message,
      );

      if (result.success) {
        // Update notification status to sent
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
            attempts: notification.attempts + 1,
          },
        });

        this.logger.log(`Notification ${notificationId} sent successfully`);
      } else {
        // Update notification with error and increment attempts
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: {
            status:
              notification.attempts + 1 >= notification.maxAttempts
                ? NotificationStatus.FAILED
                : NotificationStatus.PENDING,
            errorMessage: result.error,
            attempts: notification.attempts + 1,
          },
        });

        this.logger.error(`Failed to send notification ${notificationId}: ${result.error}`);
      }
    } catch (error) {
      this.logger.error(`Error processing notification ${notificationId}`, error);
      throw error;
    }
  }

  /**
   * Process all pending notifications
   */
  async processPendingNotifications(): Promise<number> {
    const pendingNotifications = await this.prisma.notification.findMany({
      where: {
        status: NotificationStatus.PENDING,
        attempts: {
          lt: 3, // Less than max attempts
        },
      },
      take: Number(process.env.NOTIFICATION_BATCH_SIZE) || 50,
    });

    this.logger.log(`Processing ${pendingNotifications.length} pending notifications`);

    for (const notification of pendingNotifications) {
      try {
        await this.processNotification(notification.id);
      } catch (error) {
        this.logger.error(`Failed to process notification ${notification.id}`, error);
      }
    }

    return pendingNotifications.length;
  }

  /**
   * Process scheduled notifications that are due
   */
  async processScheduledNotifications(): Promise<number> {
    const now = new Date();

    const dueNotifications = await this.prisma.notification.findMany({
      where: {
        status: NotificationStatus.SCHEDULED,
        scheduledFor: {
          lte: now,
        },
      },
      take: Number(process.env.NOTIFICATION_BATCH_SIZE) || 50,
    });

    this.logger.log(`Processing ${dueNotifications.length} scheduled notifications`);

    for (const notification of dueNotifications) {
      try {
        // Update to pending first
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: { status: NotificationStatus.PENDING },
        });

        // Then process
        await this.processNotification(notification.id);
      } catch (error) {
        this.logger.error(`Failed to process scheduled notification ${notification.id}`, error);
      }
    }

    return dueNotifications.length;
  }

  /**
   * Get all notifications with filters
   */
  async findAll(params?: {
    skip?: number;
    take?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    type?: string;
    clientId?: string;
  }) {
    const {
      skip = 0,
      take = 50,
      startDate,
      endDate,
      status,
      type,
      clientId,
    } = params || {};

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (status) where.status = status;
    if (type) where.type = type;
    if (clientId) where.clientId = clientId;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        include: {
          client: true,
          appointment: {
            include: {
              barber: true,
              service: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  /**
   * Get one notification by ID
   */
  async findOne(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        client: true,
        appointment: {
          include: {
            barber: true,
            service: true,
          },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  /**
   * Get notification statistics
   */
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, sent, pending, failed, todaySent] = await Promise.all([
      this.prisma.notification.count(),
      this.prisma.notification.count({
        where: { status: NotificationStatus.SENT },
      }),
      this.prisma.notification.count({
        where: { status: NotificationStatus.PENDING },
      }),
      this.prisma.notification.count({
        where: { status: NotificationStatus.FAILED },
      }),
      this.prisma.notification.count({
        where: {
          status: NotificationStatus.SENT,
          sentAt: {
            gte: today,
          },
        },
      }),
    ]);

    const successRate =
      total > 0 ? Math.round((sent / (total - pending)) * 100) : 0;

    return {
      total,
      sent,
      pending,
      failed,
      todaySent,
      successRate,
    };
  }

  /**
   * Retry a failed notification
   */
  async retryNotification(id: string) {
    const notification = await this.findOne(id);

    if (notification.status !== NotificationStatus.FAILED) {
      throw new Error('Only failed notifications can be retried');
    }

    // Reset status and attempts
    await this.prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.PENDING,
        attempts: 0,
        errorMessage: null,
      },
    });

    // Process immediately
    await this.processNotification(id);

    return this.findOne(id);
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(id: string) {
    const notification = await this.findOne(id);

    if (notification.status !== NotificationStatus.SCHEDULED) {
      throw new Error('Only scheduled notifications can be cancelled');
    }

    await this.prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.FAILED,
        errorMessage: 'Cancelled by system',
      },
    });

    return this.findOne(id);
  }

  /**
   * Send manual message to client
   */
  async sendManualMessage(data: {
    clientId: string;
    message: string;
  }) {
    const client = await this.prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const customMessage = MessageTemplates.customMessage({
      clientName: client.name,
      message: data.message,
    });

    return this.createNotification({
      clientId: data.clientId,
      type: NotificationType.MANUAL_MESSAGE,
      message: customMessage,
      phoneNumber: client.phone,
    });
  }
}
