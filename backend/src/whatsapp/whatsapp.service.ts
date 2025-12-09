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
  private sessionId: string | undefined;

  // Reconnection configuration
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly baseReconnectDelay = 5000; // 5 seconds
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isManualDisconnect = false;

  constructor(
    private prisma: PrismaService,
    private gateway: WhatsAppGateway,
  ) {}

  async onModuleInit() {
    this.logger.log('WhatsApp Service initialized');
    // Load existing session from database (do not auto-connect)
    // User must explicitly click "Connect" to initialize the WhatsApp client
    await this.loadExistingSession();
  }

  /**
   * Load existing session from database without connecting
   * This allows the frontend to show the last known status
   */
  private async loadExistingSession(): Promise<void> {
    try {
      const session = await this.prisma.whatsAppSession.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (session) {
        this.sessionId = session.id;
        this.logger.log(`Loaded existing session: ${session.id} (status: ${session.status})`);
      } else {
        // Create initial session record
        const newSession = await this.prisma.whatsAppSession.create({
          data: {
            status: WhatsAppConnectionStatus.DISCONNECTED,
          },
        });
        this.sessionId = newSession.id;
        this.logger.log(`Created new session: ${newSession.id}`);
      }
    } catch (error) {
      this.logger.error('Failed to load existing session', error);
    }
  }

  async onModuleDestroy() {
    // Clear reconnect timeout before destroying
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.isManualDisconnect = true; // Prevent reconnection on shutdown
    await this.disconnect();
  }

  /**
   * Initialize WhatsApp client and start connection
   * Called when user clicks "Connect" button
   */
  async initialize(): Promise<void> {
    try {
      this.logger.log('Initializing WhatsApp client...');

      // Reset reconnection state for new initialization
      this.isManualDisconnect = false;
      this.reconnectAttempts = 0;

      // Ensure we have a session ID (should be loaded from onModuleInit)
      if (!this.sessionId) {
        await this.loadExistingSession();
      }

      // Update status to CONNECTING
      await this.updateSessionStatus(WhatsAppConnectionStatus.CONNECTING);
      this.gateway.emitConnectionStatus(WhatsAppConnectionStatus.CONNECTING);

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

    // Handle client errors (including Puppeteer errors)
    this.client.on('error', async (error) => {
      this.logger.error('WhatsApp client error', error);
      await this.logEvent('error', 'WhatsApp client error', {
        message: error.message,
        stack: error.stack,
      });

      // Handle "Protocol error: Session closed" and similar Puppeteer errors
      if (
        error.message?.includes('Protocol error') ||
        error.message?.includes('Session closed') ||
        error.message?.includes('Target closed') ||
        error.message?.includes('Connection closed')
      ) {
        this.logger.warn('Puppeteer session error detected, attempting recovery...');
        await this.handleSessionClosed();
      }
    });

    // QR Code received
    this.client.on('qr', async (qr) => {
      this.logger.log('QR Code received');

      try {
        // Convert QR code to base64 image
        const qrCodeBase64 = await QRCode.toDataURL(qr);

        // Update session in database (single source of truth)
        await this.updateSessionStatus(WhatsAppConnectionStatus.QR_CODE_READY);
        await this.prisma.whatsAppSession.update({
          where: { id: this.sessionId },
          data: { qrCode: qrCodeBase64 },
        });

        // Emit QR code via WebSocket with timestamp for expiration tracking
        this.gateway.emitQrCode(qrCodeBase64, new Date());

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
      this.gateway.emitConnectionStatus(WhatsAppConnectionStatus.AUTHENTICATED);
    });

    // Authentication failed
    this.client.on('auth_failure', async (message) => {
      this.logger.error('Authentication failed', message);
      await this.updateSessionStatus(WhatsAppConnectionStatus.FAILED, message);
      await this.logEvent('error', 'Authentication failed', { message });
      this.gateway.emitConnectionStatus(WhatsAppConnectionStatus.FAILED);
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

      await this.logEvent('info', 'WhatsApp client ready', { phoneNumber });
      this.gateway.emitConnectionStatus(WhatsAppConnectionStatus.CONNECTED);
    });

    // Client disconnected
    this.client.on('disconnected', async (reason) => {
      this.logger.warn('WhatsApp client disconnected', reason);
      await this.updateSessionStatus(WhatsAppConnectionStatus.DISCONNECTED, reason);
      await this.logEvent('warn', 'WhatsApp client disconnected', { reason });
      this.gateway.emitConnectionStatus(WhatsAppConnectionStatus.DISCONNECTED);

      // Don't reconnect if it was a manual disconnect or logout
      if (this.isManualDisconnect || reason === 'LOGOUT') {
        this.logger.log('Manual disconnect or logout - not attempting reconnection');
        this.isManualDisconnect = false;
        this.reconnectAttempts = 0;
        return;
      }

      // Attempt automatic reconnection with exponential backoff
      await this.attemptReconnect(reason);
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
        qrCode: session.qrCode, // Single source of truth from database
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
   * Get current QR code from database
   */
  async getQrCode(): Promise<string | null> {
    try {
      const session = await this.prisma.whatsAppSession.findUnique({
        where: { id: this.sessionId },
        select: { qrCode: true },
      });
      return session?.qrCode || null;
    } catch (error) {
      this.logger.error('Failed to get QR code', error);
      return null;
    }
  }

  /**
   * Logout and reset WhatsApp session completely
   * This will:
   * 1. Logout from WhatsApp (invalidates session on phone)
   * 2. Delete local session files
   * 3. Clear database session data
   * 4. Require new QR code scan to reconnect
   */
  async logout(): Promise<void> {
    try {
      this.isManualDisconnect = true;
      this.reconnectAttempts = 0;

      // Clear any pending reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      if (this.client) {
        // Logout will remove the session from the phone and delete local auth files
        await this.client.logout();
        this.client = undefined;
      }

      // Clear session data in database
      if (this.sessionId) {
        await this.prisma.whatsAppSession.update({
          where: { id: this.sessionId },
          data: {
            status: WhatsAppConnectionStatus.DISCONNECTED,
            qrCode: null,
            phoneNumber: null,
            lastError: null,
          },
        });
      }

      await this.logEvent('info', 'WhatsApp session logged out and reset');
      this.gateway.emitConnectionStatus(WhatsAppConnectionStatus.DISCONNECTED);

      this.logger.log('WhatsApp session completely reset. New QR code scan required.');
    } catch (error) {
      this.logger.error('Failed to logout WhatsApp', error);
      await this.logEvent('error', 'Failed to logout', { error: error.message });

      // Fallback: force destroy if logout fails
      if (this.client) {
        try {
          await this.client.destroy();
        } catch (e) {
          this.logger.warn('Error during fallback destroy', e);
        }
        this.client = undefined;
      }

      this.isManualDisconnect = false;
      throw error;
    }
  }

  /**
   * Disconnect WhatsApp client (manual disconnect)
   */
  async disconnect(): Promise<void> {
    try {
      // Mark as manual disconnect to prevent auto-reconnection
      this.isManualDisconnect = true;
      this.reconnectAttempts = 0;

      // Clear any pending reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      if (this.client) {
        await this.client.destroy();
        this.client = undefined;
      }

      await this.updateSessionStatus(WhatsAppConnectionStatus.DISCONNECTED);
      await this.logEvent('info', 'WhatsApp client manually disconnected');
      this.gateway.emitConnectionStatus(WhatsAppConnectionStatus.DISCONNECTED);
    } catch (error) {
      this.logger.error('Failed to disconnect WhatsApp client', error);
      await this.logEvent('error', 'Failed to disconnect', { error: error.message });
      this.isManualDisconnect = false;
    }
  }

  /**
   * Attempt automatic reconnection with exponential backoff
   */
  private async attemptReconnect(reason: string): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error(`Max reconnect attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
      await this.logEvent('error', 'Max reconnect attempts reached', {
        reason,
        attempts: this.reconnectAttempts,
      });
      this.reconnectAttempts = 0;
      return;
    }

    this.reconnectAttempts++;
    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    this.logger.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);
    await this.logEvent('info', 'Attempting automatic reconnection', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delayMs: delay,
      reason,
    });

    this.reconnectTimeout = setTimeout(async () => {
      try {
        // Cleanup old client if exists
        if (this.client) {
          try {
            await this.client.destroy();
          } catch (e) {
            this.logger.warn('Error destroying old client during reconnect', e);
          }
          this.client = undefined;
        }

        // Reinitialize
        await this.initialize();

        // If we get here without error, reset reconnect attempts
        this.reconnectAttempts = 0;
        this.logger.log('Reconnection successful');
        await this.logEvent('info', 'Automatic reconnection successful');
      } catch (error) {
        this.logger.error('Reconnection attempt failed', error);
        await this.logEvent('error', 'Reconnection attempt failed', {
          attempt: this.reconnectAttempts,
          error: error.message,
        });
        // Will try again via the disconnected event
      }
    }, delay);
  }

  /**
   * Handle session closed error (e.g., Protocol error: Session closed)
   * This is called when Puppeteer loses connection to the browser
   */
  private async handleSessionClosed(): Promise<void> {
    this.logger.warn('Handling session closed error...');
    await this.logEvent('warn', 'Handling Puppeteer session closed error');

    try {
      // Update status to indicate disconnection
      await this.updateSessionStatus(
        WhatsAppConnectionStatus.DISCONNECTED,
        'Puppeteer session closed unexpectedly',
      );
      this.gateway.emitConnectionStatus(WhatsAppConnectionStatus.DISCONNECTED);

      // Cleanup existing client
      if (this.client) {
        try {
          await this.client.destroy();
        } catch (e) {
          // Ignore errors during destroy - the session is already closed
          this.logger.debug('Error during client destroy (expected)', e);
        }
        this.client = undefined;
      }

      // Attempt reconnection if not manually disconnected
      if (!this.isManualDisconnect) {
        await this.attemptReconnect('PUPPETEER_SESSION_CLOSED');
      }
    } catch (error) {
      this.logger.error('Error handling session closed', error);
      await this.logEvent('error', 'Error handling session closed', {
        error: error.message,
      });
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
