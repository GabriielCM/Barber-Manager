import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppGateway } from './whatsapp.gateway';
import { WhatsAppConnectionStatus } from '@prisma/client';

@Injectable()
export class WhatsAppService implements OnModuleInit, OnModuleDestroy {
  private client: Client | undefined;
  private readonly logger = new Logger(WhatsAppService.name);
  private currentQrCode: string | null = null;
  private sessionId: string | undefined;

  constructor(
    private prisma: PrismaService,
    private gateway: WhatsAppGateway,
  ) {}

  async onModuleInit() {
    this.logger.log('WhatsApp Service initialized');
    // Auto-initialize WhatsApp connection on module load
    await this.initialize();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Initialize WhatsApp client and restore session if available
   */
  async initialize(): Promise<void> {
    try {
      this.logger.log('Initializing WhatsApp client...');

      // Try to get existing session from database
      const session = await this.prisma.whatsAppSession.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (session) {
        this.sessionId = session.id;
      } else {
        // Create new session record
        const newSession = await this.prisma.whatsAppSession.create({
          data: {
            status: WhatsAppConnectionStatus.CONNECTING,
          },
        });
        this.sessionId = newSession.id;
      }

      // Initialize WhatsApp client with local authentication
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'barber-manager',
          dataPath: process.env.WHATSAPP_SESSION_PATH || './whatsapp-session',
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
          ],
        },
      });

      this.setupEventHandlers();

      await this.client.initialize();

      await this.logEvent('info', 'WhatsApp client initialization started');
    } catch (error) {
      this.logger.error('Failed to initialize WhatsApp client', error);
      await this.updateSessionStatus(WhatsAppConnectionStatus.FAILED, error.message);
      await this.logEvent('error', 'Failed to initialize WhatsApp client', { error: error.message });
    }
  }

  /**
   * Setup WhatsApp event handlers
   */
  private setupEventHandlers(): void {
    if (!this.client) {
      throw new Error('WhatsApp client not initialized');
    }

    // QR Code received
    this.client.on('qr', async (qr) => {
      this.logger.log('QR Code received');

      try {
        // Convert QR code to base64 image
        const qrCodeBase64 = await QRCode.toDataURL(qr);
        this.currentQrCode = qrCodeBase64;

        // Update session in database
        await this.updateSessionStatus(WhatsAppConnectionStatus.QR_CODE_READY);
        await this.prisma.whatsAppSession.update({
          where: { id: this.sessionId },
          data: { qrCode: qrCodeBase64 },
        });

        // Emit QR code via WebSocket
        this.gateway.emitQrCode(qrCodeBase64);

        await this.logEvent('info', 'QR Code generated');
      } catch (error) {
        this.logger.error('Failed to process QR code', error);
      }
    });

    // Authentication successful
    this.client.on('authenticated', async () => {
      this.logger.log('WhatsApp authenticated');
      await this.updateSessionStatus(WhatsAppConnectionStatus.AUTHENTICATED);
      await this.logEvent('info', 'WhatsApp authenticated successfully');
      this.gateway.emitConnectionStatus('authenticated');
    });

    // Authentication failed
    this.client.on('auth_failure', async (message) => {
      this.logger.error('Authentication failed', message);
      await this.updateSessionStatus(WhatsAppConnectionStatus.FAILED, message);
      await this.logEvent('error', 'Authentication failed', { message });
      this.gateway.emitConnectionStatus('failed');
    });

    // Client ready
    this.client.on('ready', async () => {
      this.logger.log('WhatsApp client is ready');

      // Get connected phone number
      const info = this.client?.info;
      const phoneNumber = info?.wid?.user || 'Unknown';

      await this.updateSessionStatus(WhatsAppConnectionStatus.CONNECTED);
      await this.prisma.whatsAppSession.update({
        where: { id: this.sessionId },
        data: {
          phoneNumber,
          lastConnectedAt: new Date(),
          qrCode: null, // Clear QR code as we're now connected
        },
      });

      this.currentQrCode = null;
      await this.logEvent('info', 'WhatsApp client ready', { phoneNumber });
      this.gateway.emitConnectionStatus('connected');
    });

    // Client disconnected
    this.client.on('disconnected', async (reason) => {
      this.logger.warn('WhatsApp client disconnected', reason);
      await this.updateSessionStatus(WhatsAppConnectionStatus.DISCONNECTED, reason);
      await this.logEvent('warn', 'WhatsApp client disconnected', { reason });
      this.gateway.emitConnectionStatus('disconnected');
    });

    // Message received (for future use - delivery confirmations)
    this.client.on('message_ack', async (message: Message, ack) => {
      // ack status:
      // 0: ACK_ERROR
      // 1: ACK_PENDING
      // 2: ACK_SERVER
      // 3: ACK_DEVICE
      // 4: ACK_READ
      // 5: ACK_PLAYED

      const ackStatus = ['error', 'pending', 'server', 'device', 'read', 'played'][ack] || 'unknown';
      this.logger.debug(`Message ${message.id._serialized} status: ${ackStatus}`);
    });
  }

  /**
   * Send WhatsApp message
   * @param phoneNumber - Phone number in WhatsApp format (e.g., 5534999999999@c.us)
   * @param message - Message text to send
   * @returns Promise with sent message info or error
   */
  async sendMessage(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.client) {
        throw new Error('WhatsApp client not initialized');
      }

      const state = await this.client.getState();
      if (state !== 'CONNECTED') {
        throw new Error(`WhatsApp client not connected. Current state: ${state}`);
      }

      // Ensure phone number has correct format
      let formattedPhone = phoneNumber;
      if (!phoneNumber.includes('@c.us')) {
        formattedPhone = `${phoneNumber}@c.us`;
      }

      // Extract just the number part (without @c.us) for validation
      const numberOnly = formattedPhone.replace('@c.us', '');

      // Check if number is registered on WhatsApp
      const numberId = await this.client.getNumberId(numberOnly);
      if (!numberId) {
        throw new Error('Este número não está registrado no WhatsApp ou não existe');
      }

      // Send message using the validated number ID
      const sentMessage = await this.client.sendMessage(numberId._serialized, message);

      await this.logEvent('info', 'Message sent successfully', {
        to: phoneNumber,
        messageId: sentMessage.id._serialized,
      });

      return {
        success: true,
        messageId: sentMessage.id._serialized,
      };
    } catch (error) {
      this.logger.error('Failed to send WhatsApp message', error);
      await this.logEvent('error', 'Failed to send message', {
        to: phoneNumber,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get current connection status
   */
  async getStatus(): Promise<{
    status: string;
    phoneNumber: string | null;
    lastConnectedAt: Date | null;
    qrCode: string | null;
  }> {
    try {
      const session = await this.prisma.whatsAppSession.findUnique({
        where: { id: this.sessionId },
      });

      if (!session) {
        return {
          status: 'DISCONNECTED',
          phoneNumber: null,
          lastConnectedAt: null,
          qrCode: null,
        };
      }

      return {
        status: session.status,
        phoneNumber: session.phoneNumber,
        lastConnectedAt: session.lastConnectedAt,
        qrCode: this.currentQrCode || session.qrCode,
      };
    } catch (error) {
      this.logger.error('Failed to get WhatsApp status', error);
      return {
        status: 'ERROR',
        phoneNumber: null,
        lastConnectedAt: null,
        qrCode: null,
      };
    }
  }

  /**
   * Get current QR code
   */
  getQrCode(): string | null {
    return this.currentQrCode;
  }

  /**
   * Disconnect WhatsApp client
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.destroy();
        this.client = undefined;
      }

      await this.updateSessionStatus(WhatsAppConnectionStatus.DISCONNECTED);
      await this.logEvent('info', 'WhatsApp client disconnected');
      this.gateway.emitConnectionStatus('disconnected');
    } catch (error) {
      this.logger.error('Failed to disconnect WhatsApp client', error);
      await this.logEvent('error', 'Failed to disconnect', { error: error.message });
    }
  }

  /**
   * Get WhatsApp logs with pagination
   */
  async getLogs(skip: number = 0, take: number = 50, level?: string): Promise<{
    logs: any[];
    total: number;
  }> {
    const where: any = {};
    if (level) {
      where.level = level;
    }

    const [logs, total] = await Promise.all([
      this.prisma.whatsAppLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.whatsAppLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Clear old logs (older than 30 days)
   */
  async clearOldLogs(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.whatsAppLog.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    this.logger.log(`Cleared ${result.count} old WhatsApp logs`);
    return result.count;
  }

  /**
   * Update session status in database
   */
  private async updateSessionStatus(
    status: WhatsAppConnectionStatus,
    error?: string,
  ): Promise<void> {
    try {
      if (!this.sessionId) return;

      await this.prisma.whatsAppSession.update({
        where: { id: this.sessionId },
        data: {
          status,
          lastError: error || null,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to update session status', error);
    }
  }

  /**
   * Log event to database
   */
  private async logEvent(
    level: string,
    message: string,
    metadata?: any,
  ): Promise<void> {
    try {
      await this.prisma.whatsAppLog.create({
        data: {
          level,
          message,
          metadata: metadata || {},
        },
      });

      // Emit log via WebSocket
      this.gateway.emitLog({
        level,
        message,
        metadata,
        createdAt: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to log event', error);
    }
  }
}
