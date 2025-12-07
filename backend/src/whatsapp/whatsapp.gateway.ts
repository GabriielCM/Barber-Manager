import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this in production
    credentials: true,
  },
  namespace: '/whatsapp',
})
export class WhatsAppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WhatsAppGateway');

  afterInit(server: Server) {
    this.logger.log('WhatsApp WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Emit QR code update to all connected clients
   */
  emitQrCode(qrCode: string) {
    this.server.emit('whatsapp.qr', { qrCode });
    this.logger.log('QR Code emitted to clients');
  }

  /**
   * Emit connection status update to all connected clients
   */
  emitConnectionStatus(status: string) {
    this.server.emit('whatsapp.status', { status });
    this.logger.log(`Connection status emitted: ${status}`);
  }

  /**
   * Emit log event to all connected clients
   */
  emitLog(log: { level: string; message: string; metadata?: any; createdAt: Date }) {
    this.server.emit('whatsapp.log', log);
  }

  /**
   * Emit notification update to all connected clients
   */
  emitNotificationUpdate(notification: any) {
    this.server.emit('notification.updated', notification);
  }
}
