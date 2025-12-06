'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { appointmentsApi, servicesApi, productsApi, checkoutApi } from '@/lib/api';
import { Appointment, Service, Product } from '@/types';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get('appointmentId');

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checkout state
  const [selectedServices, setSelectedServices] = useState<{ serviceId: string; price: number; isMain: boolean }[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!appointmentId) {
      toast.error('Selecione um agendamento');
      router.push('/dashboard/appointments');
      return;
    }

    const fetchData = async () => {
      try {
        const [aptRes, servicesRes, productsRes] = await Promise.all([
          appointmentsApi.getOne(appointmentId),
          servicesApi.getAll(true),
          productsApi.getAll(),
        ]);

        setAppointment(aptRes.data);
        setServices(servicesRes.data);
        setProducts(productsRes.data.products);

        // Pre-select main service
        if (aptRes.data.service) {
          setSelectedServices([{
            serviceId: aptRes.data.serviceId,
            price: Number(aptRes.data.service.price),
            isMain: true,
          }]);
        }
      } catch (error) {
        toast.error('Erro ao carregar dados');
        router.push('/dashboard/appointments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [appointmentId]);

  const addService = (service: Service) => {
    if (selectedServices.find(s => s.serviceId === service.id)) {
      toast.error('Serviço já adicionado');
      return;
    }
    setSelectedServices([...selectedServices, { serviceId: service.id, price: Number(service.price), isMain: false }]);
  };

  const removeService = (serviceId: string) => {
    const service = selectedServices.find(s => s.serviceId === serviceId);
    if (service?.isMain) {
      toast.error('Não pode remover o serviço principal');
      return;
    }
    setSelectedServices(selectedServices.filter(s => s.serviceId !== serviceId));
  };

  const addProduct = (product: Product) => {
    const existing = selectedProducts.find(p => p.productId === product.id);
    if (existing) {
      setSelectedProducts(selectedProducts.map(p =>
        p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, { productId: product.id, quantity: 1, unitPrice: Number(product.salePrice) }]);
    }
  };

  const updateProductQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
    } else {
      setSelectedProducts(selectedProducts.map(p =>
        p.productId === productId ? { ...p, quantity } : p
      ));
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
  };

  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0) +
    selectedProducts.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);

  const calculatedDiscount = discountPercent > 0 ? subtotal * (discountPercent / 100) : discount;
  const total = subtotal - calculatedDiscount;

  const handleSubmit = async () => {
    if (selectedServices.length === 0) {
      toast.error('Adicione pelo menos um serviço');
      return;
    }

    setIsSubmitting(true);
    try {
      await checkoutApi.create({
        appointmentId,
        services: selectedServices,
        products: selectedProducts.length > 0 ? selectedProducts : undefined,
        discount: discountPercent > 0 ? undefined : discount,
        discountPercent: discountPercent > 0 ? discountPercent : undefined,
        paymentMethod,
        notes: notes || undefined,
      });

      toast.success('Checkout realizado com sucesso!');
      router.push('/dashboard/appointments');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao finalizar checkout');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <PageLoading />;
  if (!appointment) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getServiceName = (serviceId: string) => services.find(s => s.id === serviceId)?.name || '';
  const getProductName = (productId: string) => products.find(p => p.id === productId)?.name || '';

  return (
    <>
      <Header
        title="Checkout"
        subtitle={`Atendimento de ${appointment.client?.name}`}
      />

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Add items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Cliente</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <span className="text-primary-500 font-bold text-xl">
                    {appointment.client?.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{appointment.client?.name}</p>
                  <p className="text-dark-400">{appointment.client?.phone}</p>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Serviços</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => addService(service)}
                    className="p-3 bg-dark-800 rounded-lg text-left hover:bg-dark-700 transition-colors"
                  >
                    <p className="text-white font-medium">{service.name}</p>
                    <p className="text-green-500">{formatCurrency(service.price)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Products */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Produtos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {products.slice(0, 12).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    disabled={product.quantity === 0}
                    className="p-3 bg-dark-800 rounded-lg text-left hover:bg-dark-700 transition-colors disabled:opacity-50"
                  >
                    <p className="text-white font-medium">{product.name}</p>
                    <p className="text-green-500">{formatCurrency(product.salePrice)}</p>
                    <p className="text-dark-400 text-sm">Estoque: {product.quantity}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Cart */}
          <div className="card h-fit sticky top-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ShoppingCartIcon className="w-5 h-5" />
              Resumo
            </h3>

            {/* Selected Services */}
            <div className="space-y-2 mb-4">
              <p className="text-dark-400 text-sm font-medium">Serviços</p>
              {selectedServices.map((item) => (
                <div key={item.serviceId} className="flex items-center justify-between p-2 bg-dark-800 rounded">
                  <div>
                    <span className="text-white">{getServiceName(item.serviceId)}</span>
                    {item.isMain && <span className="ml-2 text-xs text-primary-500">(Principal)</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">{formatCurrency(item.price)}</span>
                    {!item.isMain && (
                      <button onClick={() => removeService(item.serviceId)} className="text-red-500">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Products */}
            {selectedProducts.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-dark-400 text-sm font-medium">Produtos</p>
                {selectedProducts.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-2 bg-dark-800 rounded">
                    <span className="text-white">{getProductName(item.productId)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateProductQty(item.productId, item.quantity - 1)}
                        className="w-6 h-6 bg-dark-700 rounded text-white"
                      >-</button>
                      <span className="text-white w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateProductQty(item.productId, item.quantity + 1)}
                        className="w-6 h-6 bg-dark-700 rounded text-white"
                      >+</button>
                      <span className="text-green-500 w-20 text-right">{formatCurrency(item.unitPrice * item.quantity)}</span>
                      <button onClick={() => removeProduct(item.productId)} className="text-red-500">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Discount */}
            <div className="space-y-2 mb-4">
              <p className="text-dark-400 text-sm font-medium">Desconto</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-dark-500">Valor (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => { setDiscount(Number(e.target.value)); setDiscountPercent(0); }}
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-500">Percentual (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => { setDiscountPercent(Number(e.target.value)); setDiscount(0); }}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="text-dark-400 text-sm font-medium block mb-2">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input"
              >
                <option value="PIX">PIX</option>
                <option value="CASH">Dinheiro</option>
                <option value="CREDIT_CARD">Cartão de Crédito</option>
                <option value="DEBIT_CARD">Cartão de Débito</option>
                <option value="TRANSFER">Transferência</option>
              </select>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="text-dark-400 text-sm font-medium block mb-2">Observações</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input"
                rows={2}
              />
            </div>

            {/* Totals */}
            <div className="border-t border-dark-700 pt-4 space-y-2">
              <div className="flex justify-between text-dark-400">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {calculatedDiscount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Desconto</span>
                  <span>-{formatCurrency(calculatedDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-white">
                <span>Total</span>
                <span className="text-green-500">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedServices.length === 0}
              className="btn btn-primary w-full mt-6 py-3"
            >
              {isSubmitting ? 'Finalizando...' : 'Finalizar Atendimento'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
