import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

let socket: Socket | null = null;

/**
 * Initialize WhatsApp WebSocket connection
 */
export const initWhatsAppSocket = () => {
  if (socket) return socket;

  socket = io(`${SOCKET_URL}/whatsapp`, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('WhatsApp WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('WhatsApp WebSocket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('WhatsApp WebSocket connection error:', error);
  });

  return socket;
};

/**
 * Disconnect WhatsApp WebSocket
 */
export const disconnectWhatsAppSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Subscribe to QR code updates
 */
export const onQrCode = (callback: (data: { qrCode: string }) => void) => {
  if (!socket) initWhatsAppSocket();
  socket?.on('whatsapp.qr', callback);
};

/**
 * Subscribe to connection status updates
 */
export const onConnectionStatus = (callback: (data: { status: string }) => void) => {
  if (!socket) initWhatsAppSocket();
  socket?.on('whatsapp.status', callback);
};

/**
 * Subscribe to log events
 */
export const onLog = (callback: (log: { level: string; message: string; metadata?: any; createdAt: Date }) => void) => {
  if (!socket) initWhatsAppSocket();
  socket?.on('whatsapp.log', callback);
};

/**
 * Subscribe to notification updates
 */
export const onNotificationUpdate = (callback: (notification: any) => void) => {
  if (!socket) initWhatsAppSocket();
  socket?.on('notification.updated', callback);
};

/**
 * Unsubscribe from QR code updates
 */
export const offQrCode = () => {
  socket?.off('whatsapp.qr');
};

/**
 * Unsubscribe from connection status updates
 */
export const offConnectionStatus = () => {
  socket?.off('whatsapp.status');
};

/**
 * Unsubscribe from log events
 */
export const offLog = () => {
  socket?.off('whatsapp.log');
};

/**
 * Unsubscribe from notification updates
 */
export const offNotificationUpdate = () => {
  socket?.off('notification.updated');
};

/**
 * Get the current socket instance
 */
export const getSocket = () => socket;
