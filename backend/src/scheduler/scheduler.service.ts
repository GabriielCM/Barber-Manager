import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from '../notifications/notifications.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private notificationsService: NotificationsService,
    private whatsappService: WhatsAppService,
  ) {}

  /**
   * Process pending notifications every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingNotifications() {
    try {
      const count = await this.notificationsService.processPendingNotifications();
      if (count > 0) {
        this.logger.log(`Processed ${count} pending notifications`);
      }
    } catch (error) {
      this.logger.error('Failed to process pending notifications', error);
    }
  }

  /**
   * Process scheduled notifications every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processScheduledNotifications() {
    try {
      const count = await this.notificationsService.processScheduledNotifications();
      if (count > 0) {
        this.logger.log(`Processed ${count} scheduled notifications`);
      }
    } catch (error) {
      this.logger.error('Failed to process scheduled notifications', error);
    }
  }

  /**
   * Clear old WhatsApp logs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async clearOldLogs() {
    try {
      const count = await this.whatsappService.clearOldLogs();
      if (count > 0) {
        this.logger.log(`Cleared ${count} old WhatsApp logs`);
      }
    } catch (error) {
      this.logger.error('Failed to clear old logs', error);
    }
  }

  /**
   * Health check - runs every 10 minutes
   * Logs scheduler status
   */
  @Cron('*/10 * * * *')
  async healthCheck() {
    this.logger.debug('Scheduler health check - all cron jobs running');
  }
}
