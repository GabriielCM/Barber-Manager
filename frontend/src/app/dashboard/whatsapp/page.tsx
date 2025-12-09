'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  Button,
  Card,
  CardTitle,
  CardSkeleton,
  Badge,
  ConfirmDialog,
} from '@/components/ui';
import { whatsappApi } from '@/lib/api';
import { useWhatsAppStatus, WHATSAPP_STATUS } from '@/hooks/useWhatsAppStatus';
import toast from 'react-hot-toast';
import {
  SignalIcon,
  SignalSlashIcon,
  QrCodeIcon,
  ArrowPathIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * QR Code Countdown Timer Component
 */
function QrCountdown({ generatedAt, expiresInSeconds }: { generatedAt: Date | null; expiresInSeconds: number }) {
  const [secondsLeft, setSecondsLeft] = useState(expiresInSeconds);

  const calculateSecondsLeft = useCallback(() => {
    if (!generatedAt) return expiresInSeconds;
    const elapsed = Math.floor((Date.now() - new Date(generatedAt).getTime()) / 1000);
    return Math.max(0, expiresInSeconds - elapsed);
  }, [generatedAt, expiresInSeconds]);

  useEffect(() => {
    setSecondsLeft(calculateSecondsLeft());

    const interval = setInterval(() => {
      setSecondsLeft(calculateSecondsLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateSecondsLeft]);

  const isExpired = secondsLeft <= 0;
  const isWarning = secondsLeft <= 15 && secondsLeft > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center gap-2 text-sm ${isExpired ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-dark-400'}`}
    >
      <ClockIcon className="w-4 h-4" />
      {isExpired ? (
        <span>QR Code expirado - aguarde novo código</span>
      ) : (
        <motion.span
          key={secondsLeft}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          Expira em {secondsLeft}s
        </motion.span>
      )}
    </motion.div>
  );
}

export default function WhatsAppPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialStatus, setInitialStatus] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [clearLogsDialog, setClearLogsDialog] = useState(false);

  // Real-time status updates via WebSocket
  const realtimeStatus = useWhatsAppStatus();

  useEffect(() => {
    fetchStatus();
    fetchLogs();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await whatsappApi.getStatus();
      setInitialStatus(response.data);
    } catch (error) {
      toast.error('Erro ao carregar status do WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const response = await whatsappApi.getLogs({ take: 50 });
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleInitialize = async () => {
    try {
      setIsInitializing(true);
      await whatsappApi.initialize();
      toast.success('Inicializando conexão WhatsApp...');
      setTimeout(() => fetchStatus(), 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao inicializar WhatsApp');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await whatsappApi.disconnect();
      toast.success('WhatsApp desconectado');
      fetchStatus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao desconectar WhatsApp');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await whatsappApi.clearLogs();
      toast.success('Logs antigos removidos');
      fetchLogs();
      setClearLogsDialog(false);
    } catch (error: any) {
      toast.error('Erro ao limpar logs');
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <Header title="WhatsApp" subtitle="Gerenciar conexão e notificações" />
        <div className="p-8 space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </PageTransition>
    );
  }

  // Use realtime status when available, fallback to initial status from API
  const status = realtimeStatus.status !== WHATSAPP_STATUS.DISCONNECTED ? realtimeStatus : initialStatus;
  const qrCode = realtimeStatus.qrCode || initialStatus?.qrCode;
  const isConnected = [WHATSAPP_STATUS.CONNECTED, WHATSAPP_STATUS.AUTHENTICATED].includes(status?.status) ||
                      realtimeStatus.isConnected;

  return (
    <PageTransition>
      <Header title="WhatsApp" subtitle="Gerenciar conexão e notificações" />

      <div className="p-8 space-y-6">
        {/* Connection Status Card */}
        <FadeIn>
          <Card>
            <div className="flex items-center justify-between mb-6">
              <CardTitle className="flex items-center gap-2">
                <motion.div
                  animate={isConnected ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: isConnected ? Infinity : 0, duration: 2 }}
                >
                  {isConnected ? (
                    <SignalIcon className="w-6 h-6 text-green-500" />
                  ) : (
                    <SignalSlashIcon className="w-6 h-6 text-red-500" />
                  )}
                </motion.div>
                Status da Conexão
              </CardTitle>
              <div className="flex gap-2">
                {isConnected ? (
                  <Button
                    variant="secondary"
                    onClick={handleDisconnect}
                    isLoading={isDisconnecting}
                    leftIcon={<XMarkIcon className="w-4 h-4" />}
                  >
                    Desconectar
                  </Button>
                ) : (
                  <Button
                    onClick={handleInitialize}
                    isLoading={isInitializing}
                    leftIcon={<ArrowPathIcon className={`w-4 h-4 ${isInitializing ? 'animate-spin' : ''}`} />}
                  >
                    Conectar
                  </Button>
                )}
              </div>
            </div>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StaggerItem>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-dark-800 rounded-lg border border-dark-700"
                >
                  <p className="text-dark-400 text-sm mb-1">Status</p>
                  <motion.p
                    key={isConnected ? 'connected' : 'disconnected'}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`font-semibold ${isConnected ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </motion.p>
                </motion.div>
              </StaggerItem>
              <StaggerItem>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-dark-800 rounded-lg border border-dark-700"
                >
                  <p className="text-dark-400 text-sm mb-1">Telefone</p>
                  <p className="text-white font-semibold">
                    {status?.phoneNumber || 'Não conectado'}
                  </p>
                </motion.div>
              </StaggerItem>
              <StaggerItem>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-dark-800 rounded-lg border border-dark-700"
                >
                  <p className="text-dark-400 text-sm mb-1">Última Conexão</p>
                  <p className="text-white font-semibold">
                    {status?.lastConnectedAt
                      ? new Date(status.lastConnectedAt).toLocaleString('pt-BR')
                      : 'Nunca'}
                  </p>
                </motion.div>
              </StaggerItem>
            </StaggerContainer>
          </Card>
        </FadeIn>

        {/* QR Code Section */}
        <AnimatePresence>
          {qrCode && !isConnected && (
            <FadeIn>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="flex items-center gap-2">
                    <QrCodeIcon className="w-6 h-6" />
                    Escanear QR Code
                  </CardTitle>
                  <QrCountdown
                    generatedAt={realtimeStatus.qrGeneratedAt}
                    expiresInSeconds={realtimeStatus.qrExpiresInSeconds}
                  />
                </div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="bg-white p-4 rounded-lg inline-block"
                >
                  <Image src={qrCode} alt="WhatsApp QR Code" width={256} height={256} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 text-dark-400 space-y-1"
                >
                  <p>1. Abra o WhatsApp no seu celular</p>
                  <p>2. Toque em <strong className="text-white">Mais opções</strong> ou <strong className="text-white">Configurações</strong></p>
                  <p>3. Toque em <strong className="text-white">Aparelhos conectados</strong></p>
                  <p>4. Toque em <strong className="text-white">Conectar um aparelho</strong></p>
                  <p>5. Aponte seu celular para esta tela para escanear o código</p>
                </motion.div>
              </Card>
            </FadeIn>
          )}
        </AnimatePresence>

        {/* Logs Section */}
        <FadeIn delay={0.2}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Logs de Atividade</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchLogs}
                  isLoading={logsLoading}
                  leftIcon={<ArrowPathIcon className="w-4 h-4" />}
                >
                  Atualizar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setClearLogsDialog(true)}
                >
                  Limpar Antigos
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-dark-400 text-center py-8">Nenhum log disponível</p>
              ) : (
                <StaggerContainer className="space-y-2">
                  {logs.map((log) => (
                    <StaggerItem key={log.id}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        className={`p-3 rounded-lg transition-colors ${
                          log.level === 'error'
                            ? 'bg-red-500/10 border border-red-500/20'
                            : log.level === 'warn'
                            ? 'bg-yellow-500/10 border border-yellow-500/20'
                            : 'bg-dark-800 border border-dark-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={
                                  log.level === 'error'
                                    ? 'danger'
                                    : log.level === 'warn'
                                    ? 'warning'
                                    : 'info'
                                }
                                size="sm"
                              >
                                {log.level.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-dark-400">
                                {new Date(log.createdAt).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-white text-sm">{log.message}</p>
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <pre className="text-xs text-dark-400 mt-1 overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* Clear Logs Confirmation */}
      <ConfirmDialog
        isOpen={clearLogsDialog}
        onClose={() => setClearLogsDialog(false)}
        onConfirm={handleClearLogs}
        title="Limpar Logs Antigos"
        message="Deseja limpar os logs antigos (mais de 30 dias)? Esta ação não pode ser desfeita."
        variant="warning"
        confirmText="Limpar Logs"
      />
    </PageTransition>
  );
}
