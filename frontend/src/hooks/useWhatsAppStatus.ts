import { useEffect, useState } from 'react';
import {
  initWhatsAppSocket,
  disconnectWhatsAppSocket,
  onQrCode,
  onConnectionStatus,
  offQrCode,
  offConnectionStatus,
} from '@/lib/websocket';

interface WhatsAppStatus {
  status: string;
  qrCode: string | null;
  qrGeneratedAt: Date | null;
  qrExpiresInSeconds: number;
  isConnected: boolean;
  isLoading: boolean;
}

/**
 * Custom hook for WhatsApp connection status with real-time updates
 */
// Status constants matching backend enum (WhatsAppConnectionStatus)
export const WHATSAPP_STATUS = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  QR_CODE_READY: 'QR_CODE_READY',
  AUTHENTICATED: 'AUTHENTICATED',
  FAILED: 'FAILED',
} as const;

export type WhatsAppStatusType = typeof WHATSAPP_STATUS[keyof typeof WHATSAPP_STATUS];

export function useWhatsAppStatus() {
  const [state, setState] = useState<WhatsAppStatus>({
    status: WHATSAPP_STATUS.DISCONNECTED,
    qrCode: null,
    qrGeneratedAt: null,
    qrExpiresInSeconds: 60,
    isConnected: false,
    isLoading: true,
  });

  useEffect(() => {
    // Initialize WebSocket connection
    initWhatsAppSocket();

    // Subscribe to real-time updates
    onQrCode((data: { qrCode: string; generatedAt?: string; expiresInSeconds?: number }) => {
      setState((prev) => ({
        ...prev,
        qrCode: data.qrCode,
        qrGeneratedAt: data.generatedAt ? new Date(data.generatedAt) : new Date(),
        qrExpiresInSeconds: data.expiresInSeconds || 60,
        status: WHATSAPP_STATUS.QR_CODE_READY,
        isLoading: false,
      }));
    });

    onConnectionStatus((data) => {
      const isConnected = data.status === WHATSAPP_STATUS.CONNECTED ||
                          data.status === WHATSAPP_STATUS.AUTHENTICATED;
      setState((prev) => ({
        ...prev,
        status: data.status,
        isConnected,
        qrCode: isConnected ? null : prev.qrCode, // Clear QR code when connected
        qrGeneratedAt: isConnected ? null : prev.qrGeneratedAt, // Clear QR timestamp
        isLoading: false,
      }));
    });

    // Initial load from API is handled by the component

    // Cleanup - disconnect WebSocket when component unmounts
    return () => {
      offQrCode();
      offConnectionStatus();
      disconnectWhatsAppSocket();
    };
  }, []);

  return state;
}
