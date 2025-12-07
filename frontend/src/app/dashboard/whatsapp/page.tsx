'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { whatsappApi } from '@/lib/api';
import { useWhatsAppStatus } from '@/hooks/useWhatsAppStatus';
import toast from 'react-hot-toast';
import {
  SignalIcon,
  SignalSlashIcon,
  QrCodeIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function WhatsAppPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialStatus, setInitialStatus] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

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
    if (!confirm('Deseja limpar os logs antigos (mais de 30 dias)?')) return;

    try {
      await whatsappApi.clearLogs();
      toast.success('Logs antigos removidos');
      fetchLogs();
    } catch (error: any) {
      toast.error('Erro ao limpar logs');
    }
  };

  if (isLoading) return <PageLoading />;

  const status = realtimeStatus.status !== 'disconnected' ? realtimeStatus : initialStatus;
  const qrCode = realtimeStatus.qrCode || initialStatus?.qrCode;
  const isConnected = status?.status === 'CONNECTED' || status?.status === 'AUTHENTICATED' || realtimeStatus.isConnected;

  return (
    <>
      <Header title="WhatsApp" subtitle="Gerenciar conexão e notificações" />

      <div className="p-8 space-y-6">
        {/* Connection Status Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              {isConnected ? (
                <SignalIcon className="w-6 h-6 text-green-500" />
              ) : (
                <SignalSlashIcon className="w-6 h-6 text-red-500" />
              )}
              Status da Conexão
            </h3>
            <div className="flex gap-2">
              {isConnected ? (
                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <XMarkIcon className="w-4 h-4" />
                  {isDisconnecting ? 'Desconectando...' : 'Desconectar'}
                </button>
              ) : (
                <button
                  onClick={handleInitialize}
                  disabled={isInitializing}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${isInitializing ? 'animate-spin' : ''}`} />
                  {isInitializing ? 'Inicializando...' : 'Conectar'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-dark-800 rounded-lg">
              <p className="text-dark-400 text-sm mb-1">Status</p>
              <p className={`font-semibold ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </p>
            </div>
            <div className="p-4 bg-dark-800 rounded-lg">
              <p className="text-dark-400 text-sm mb-1">Telefone</p>
              <p className="text-white font-semibold">
                {status?.phoneNumber || 'Não conectado'}
              </p>
            </div>
            <div className="p-4 bg-dark-800 rounded-lg">
              <p className="text-dark-400 text-sm mb-1">Última Conexão</p>
              <p className="text-white font-semibold">
                {status?.lastConnectedAt
                  ? new Date(status.lastConnectedAt).toLocaleString('pt-BR')
                  : 'Nunca'}
              </p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        {qrCode && !isConnected && (
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <QrCodeIcon className="w-6 h-6" />
              Escanear QR Code
            </h3>
            <div className="bg-white p-4 rounded-lg inline-block">
              <Image src={qrCode} alt="WhatsApp QR Code" width={256} height={256} />
            </div>
            <p className="mt-4 text-dark-400">
              1. Abra o WhatsApp no seu celular
              <br />
              2. Toque em <strong>Mais opções</strong> ou <strong>Configurações</strong>
              <br />
              3. Toque em <strong>Aparelhos conectados</strong>
              <br />
              4. Toque em <strong>Conectar um aparelho</strong>
              <br />
              5. Aponte seu celular para esta tela para escanear o código
            </p>
          </div>
        )}

        {/* Logs Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Logs de Atividade</h3>
            <div className="flex gap-2">
              <button
                onClick={fetchLogs}
                disabled={logsLoading}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <ArrowPathIcon className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                onClick={handleClearLogs}
                className="btn btn-secondary btn-sm"
              >
                Limpar Antigos
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-dark-400 text-center py-4">Nenhum log disponível</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg ${
                    log.level === 'error'
                      ? 'bg-red-500/10 border border-red-500/20'
                      : log.level === 'warn'
                      ? 'bg-yellow-500/10 border border-yellow-500/20'
                      : 'bg-dark-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-semibold uppercase ${
                            log.level === 'error'
                              ? 'text-red-500'
                              : log.level === 'warn'
                              ? 'text-yellow-500'
                              : 'text-primary-500'
                          }`}
                        >
                          {log.level}
                        </span>
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
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
