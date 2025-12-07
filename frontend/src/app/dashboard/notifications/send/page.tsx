'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { clientsApi, notificationsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { PaperAirplaneIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const messageTemplates = [
  {
    label: 'Personalizada',
    value: '',
    template: '',
  },
  {
    label: 'Boas-vindas',
    value: 'welcome',
    template: 'Olá! Seja bem-vindo à nossa barbearia! Estamos à disposição para atendê-lo.',
  },
  {
    label: 'Agradecimento',
    value: 'thanks',
    template: 'Obrigado por escolher nossa barbearia! Foi um prazer atendê-lo. Esperamos vê-lo novamente em breve!',
  },
  {
    label: 'Promoção',
    value: 'promo',
    template: 'Temos uma promoção especial para você! Entre em contato para saber mais detalhes.',
  },
  {
    label: 'Lembrete de Retorno',
    value: 'return',
    template: 'Olá! Já faz um tempo que não te vemos por aqui. Que tal agendar um horário? Estamos com saudades!',
  },
];

export default function SendNotificationPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchClients();
    } else {
      setClients([]);
    }
  }, [searchTerm]);

  const searchClients = async () => {
    try {
      setIsLoading(true);
      const response = await clientsApi.search(searchTerm);
      setClients(response.data.clients || response.data);
    } catch (error) {
      console.error('Failed to search clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateChange = (templateValue: string) => {
    setSelectedTemplate(templateValue);
    const template = messageTemplates.find((t) => t.value === templateValue);
    if (template) {
      setMessage(template.template);
    }
  };

  const handleSend = async () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
      return;
    }

    if (!message.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    try {
      setIsSending(true);
      await notificationsApi.sendManual({
        clientId: selectedClient.id,
        message: message.trim(),
      });
      toast.success('Mensagem enviada com sucesso!');
      router.push('/dashboard/notifications');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Header
        title="Enviar Mensagem"
        subtitle="Enviar mensagem manual via WhatsApp"
        backButton
      />

      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="card space-y-6">
            {/* Client Search */}
            <div>
              <label className="label">Buscar Cliente *</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  placeholder="Digite o nome ou telefone do cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>

              {/* Client Search Results */}
              {searchTerm.length >= 2 && (
                <div className="mt-2 bg-dark-800 rounded-lg border border-dark-700 max-h-60 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-4 text-center text-dark-400">Buscando...</div>
                  ) : clients.length === 0 ? (
                    <div className="p-4 text-center text-dark-400">Nenhum cliente encontrado</div>
                  ) : (
                    clients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => {
                          setSelectedClient(client);
                          setSearchTerm(client.name);
                          setClients([]);
                        }}
                        className="w-full p-3 hover:bg-dark-700 text-left transition-colors border-b border-dark-700 last:border-0"
                      >
                        <p className="text-white font-medium">{client.name}</p>
                        <p className="text-dark-400 text-sm">{client.phone}</p>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Selected Client */}
              {selectedClient && (
                <div className="mt-3 p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{selectedClient.name}</p>
                      <p className="text-dark-400 text-sm">{selectedClient.phone}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedClient(null);
                        setSearchTerm('');
                      }}
                      className="text-red-500 hover:text-red-400 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Template Selector */}
            <div>
              <label className="label">Modelo de Mensagem</label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="input"
              >
                {messageTemplates.map((template) => (
                  <option key={template.value} value={template.value}>
                    {template.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Message Input */}
            <div>
              <label className="label">Mensagem *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem aqui..."
                className="input min-h-[200px]"
                maxLength={1000}
              />
              <p className="text-dark-400 text-sm mt-1 text-right">
                {message.length} / 1000 caracteres
              </p>
            </div>

            {/* Preview */}
            {message && selectedClient && (
              <div>
                <label className="label">Visualização</label>
                <div className="bg-dark-800 p-4 rounded-lg border border-dark-700">
                  <p className="text-dark-400 text-sm mb-2">
                    Para: <span className="text-white">{selectedClient.name}</span> ({selectedClient.phone})
                  </p>
                  <div className="bg-dark-900 p-4 rounded-lg">
                    <p className="text-white whitespace-pre-wrap">{message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-dark-700">
              <button
                onClick={() => router.back()}
                className="btn btn-secondary flex-1"
                disabled={isSending}
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                disabled={!selectedClient || !message.trim() || isSending}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                {isSending ? 'Enviando...' : 'Enviar Mensagem'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
