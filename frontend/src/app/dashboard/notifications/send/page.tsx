'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import {
  PageTransition,
  FadeIn,
  Button,
  Input,
  Select,
  Textarea,
  Card,
  CardSkeleton,
} from '@/components/ui';
import { clientsApi, notificationsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { PaperAirplaneIcon, MagnifyingGlassIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

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

const templateOptions = messageTemplates.map((t) => ({
  value: t.value,
  label: t.label,
}));

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

  const characterCount = message.length;
  const maxCharacters = 1000;
  const isNearLimit = characterCount > maxCharacters * 0.8;

  return (
    <PageTransition>
      <Header
        title="Enviar Mensagem"
        subtitle="Enviar mensagem manual via WhatsApp"
        backButton
      />

      <div className="p-8">
        <FadeIn>
          <div className="max-w-3xl mx-auto">
            <Card className="space-y-6">
              {/* Client Search */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Buscar Cliente <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <input
                    type="text"
                    placeholder="Digite o nome ou telefone do cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Client Search Results */}
                <AnimatePresence>
                  {searchTerm.length >= 2 && !selectedClient && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-2 bg-dark-800 rounded-lg border border-dark-700 max-h-60 overflow-y-auto"
                    >
                      {isLoading ? (
                        <div className="p-4 text-center text-dark-400">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"
                          />
                          Buscando...
                        </div>
                      ) : clients.length === 0 ? (
                        <div className="p-4 text-center text-dark-400">
                          Nenhum cliente encontrado
                        </div>
                      ) : (
                        clients.map((client, index) => (
                          <motion.button
                            key={client.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => {
                              setSelectedClient(client);
                              setSearchTerm(client.name);
                              setClients([]);
                            }}
                            className="w-full p-3 hover:bg-dark-700 text-left transition-colors border-b border-dark-700 last:border-0 flex items-center gap-3"
                          >
                            <div className="w-10 h-10 bg-dark-600 rounded-full flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-dark-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{client.name}</p>
                              <p className="text-dark-400 text-sm">{client.phone}</p>
                            </div>
                          </motion.button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Selected Client */}
                <AnimatePresence>
                  {selectedClient && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="mt-3 p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-primary-500" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{selectedClient.name}</p>
                            <p className="text-dark-400 text-sm">{selectedClient.phone}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedClient(null);
                            setSearchTerm('');
                          }}
                          leftIcon={<XMarkIcon className="w-4 h-4" />}
                          className="text-red-500 hover:text-red-400"
                        >
                          Remover
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Template Selector */}
              <Select
                label="Modelo de Mensagem"
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                options={templateOptions}
              />

              {/* Message Input */}
              <div>
                <Textarea
                  label="Mensagem"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem aqui..."
                  rows={8}
                />
                <div className="flex justify-end mt-1">
                  <motion.span
                    animate={{
                      color: isNearLimit ? '#ef4444' : '#64748b',
                    }}
                    className="text-sm"
                  >
                    {characterCount} / {maxCharacters} caracteres
                  </motion.span>
                </div>
              </div>

              {/* Preview */}
              <AnimatePresence>
                {message && selectedClient && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Visualização
                    </label>
                    <div className="bg-dark-800 p-4 rounded-lg border border-dark-700">
                      <p className="text-dark-400 text-sm mb-2">
                        Para: <span className="text-white font-medium">{selectedClient.name}</span>{' '}
                        <span className="text-dark-500">({selectedClient.phone})</span>
                      </p>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-dark-900 p-4 rounded-lg border border-dark-700"
                      >
                        <p className="text-white whitespace-pre-wrap">{message}</p>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-dark-700">
                <Button
                  variant="secondary"
                  onClick={() => router.back()}
                  disabled={isSending}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!selectedClient || !message.trim() || isSending}
                  isLoading={isSending}
                  leftIcon={<PaperAirplaneIcon className="w-5 h-5" />}
                  className="flex-1"
                >
                  Enviar Mensagem
                </Button>
              </div>
            </Card>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
