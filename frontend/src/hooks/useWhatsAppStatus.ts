import { useEffect, useState } from 'react';
import { initWhatsAppSocket, onQrCode, onConnectionStatus, offQrCode, offConnectionStatus } from '@/lib/websocket';

interface WhatsAppStatus {
  status: string;
  qrCode: string | null;
  isConnected: boolean;
  isLoading: boolean;
}

/**
 * Custom hook for WhatsApp connection status with real-time updates
 */
export function useWhatsAppStatus() {
  const [state, setState] = useState<WhatsAppStatus>({
    status: 'disconnected',
    qrCode: null,
    isConnected: false,
    isLoading: true,
  });

  useEffect(() => {
    // Initialize WebSocket connection
    initWhatsAppSocket();

    // Subscribe to real-time updates
    onQrCode((data) => {
      setState((prev) => ({
        ...prev,
        qrCode: data.qrCode,
        status: 'qr_ready',
        isLoading: false,
      }));
    });

    onConnectionStatus((data) => {
      const isConnected = data.status === 'connected' || data.status === 'authenticated';
      setState((prev) => ({
        ...prev,
        status: data.status,
        isConnected,
        qrCode: isConnected ? null : prev.qrCode, // Clear QR code when connected
        isLoading: false,
      }));
    });

    // Initial load from API is handled by the component

    // Cleanup
    return () => {
      offQrCode();
      offConnectionStatus();
    };
  }, []);

  return state;
}
