import { useState, useCallback } from 'react';
import { subscriptionsApi } from '@/lib/api';
import { Subscription, SubscriptionPreview } from '@/types/subscription';
import toast from 'react-hot-toast';

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await subscriptionsApi.getAll(filters);
      setSubscriptions(response.data.subscriptions);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao buscar assinaturas';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const previewSubscription = useCallback(async (data: any): Promise<SubscriptionPreview | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await subscriptionsApi.preview(data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao gerar prévia';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSubscription = useCallback(async (data: any, adjustments?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await subscriptionsApi.create(data, adjustments);
      toast.success('Assinatura criada com sucesso!');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao criar assinatura';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const pauseSubscription = useCallback(async (id: string, reason?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await subscriptionsApi.pause(id, reason);
      toast.success('Assinatura pausada!');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao pausar assinatura';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resumeSubscription = useCallback(async (id: string, newStartDate: string, reason?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await subscriptionsApi.resume(id, newStartDate, reason);
      toast.success('Assinatura retomada!');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao retomar assinatura';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelSubscription = useCallback(async (id: string, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await subscriptionsApi.cancel(id, reason);
      toast.success('Assinatura cancelada!');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao cancelar assinatura';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    subscriptions,
    loading,
    error,
    fetchSubscriptions,
    previewSubscription,
    createSubscription,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
  };
}
