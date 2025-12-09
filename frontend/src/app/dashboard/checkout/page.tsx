'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardTitle,
  CardSkeleton,
  AnimatedCurrency,
} from '@/components/ui';
import { appointmentsApi, servicesApi, productsApi, checkoutApi } from '@/lib/api';
import { Appointment, Service, Product } from '@/types';
import toast from 'react-hot-toast';
import { TrashIcon, ShoppingCartIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

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

        // Pre-select services based on appointment type
        const apt = aptRes.data;

        if (apt.isSubscriptionBased && apt.subscription?.package) {
          const packageServices = apt.subscription.package.services || [];
          const packageFinalPrice = Number(apt.subscription.package.finalPrice);
          const packageBasePrice = Number(apt.subscription.package.basePrice);
          const priceRatio = packageFinalPrice / packageBasePrice;

          setSelectedServices(packageServices.map((ps: any, index: number) => ({
            serviceId: ps.service?.id || ps.serviceId,
            price: Number(ps.service?.price || 0) * priceRatio,
            isMain: index === 0,
          })));
        } else if (apt.appointmentServices && apt.appointmentServices.length > 0) {
          setSelectedServices(apt.appointmentServices.map((as: any, index: number) => ({
            serviceId: as.serviceId,
            price: Number(as.service?.price || 0),
            isMain: index === 0,
          })));
        } else if (apt.service) {
          setSelectedServices([{
            serviceId: apt.serviceId,
            price: Number(apt.service.price),
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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getServiceName = (serviceId: string) => services.find(s => s.id === serviceId)?.name || '';
  const getProductName = (productId: string) => products.find(p => p.id === productId)?.name || '';

  const paymentOptions = [
    { value: 'PIX', label: 'PIX' },
    { value: 'CASH', label: 'Dinheiro' },
    { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
    { value: 'DEBIT_CARD', label: 'Cartão de Débito' },
    { value: 'TRANSFER', label: 'Transferência' },
  ];

  if (isLoading) {
    return (
      <PageTransition>
        <Header title="Checkout" subtitle="Carregando..." />
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <CardSkeleton />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!appointment) return null;

  return (
    <PageTransition>
      <Header
        title="Checkout"
        subtitle={`Atendimento de ${appointment.client?.name}`}
      />

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Add items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Info */}
            <FadeIn>
              <Card>
                <CardTitle className="mb-4">Cliente</CardTitle>
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center"
                  >
                    <span className="text-primary-500 font-bold text-xl">
                      {appointment.client?.name.charAt(0)}
                    </span>
                  </motion.div>
                  <div>
                    <p className="text-white font-medium">{appointment.client?.name}</p>
                    <p className="text-dark-400">{appointment.client?.phone}</p>
                  </div>
                </div>
              </Card>
            </FadeIn>

            {/* Services */}
            <FadeIn delay={0.1}>
              <Card>
                <CardTitle className="mb-4">Serviços</CardTitle>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {services.map((service, index) => (
                    <motion.button
                      key={service.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addService(service)}
                      className="p-3 bg-dark-800 rounded-lg text-left hover:bg-dark-700 transition-colors border border-dark-700 hover:border-primary-500/30"
                    >
                      <p className="text-white font-medium">{service.name}</p>
                      <p className="text-green-500">{formatCurrency(service.price)}</p>
                    </motion.button>
                  ))}
                </div>
              </Card>
            </FadeIn>

            {/* Products */}
            <FadeIn delay={0.2}>
              <Card>
                <CardTitle className="mb-4">Produtos</CardTitle>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {products.slice(0, 12).map((product, index) => (
                    <motion.button
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addProduct(product)}
                      disabled={product.quantity === 0}
                      className="p-3 bg-dark-800 rounded-lg text-left hover:bg-dark-700 transition-colors border border-dark-700 hover:border-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-green-500">{formatCurrency(product.salePrice)}</p>
                      <p className="text-dark-400 text-sm">Estoque: {product.quantity}</p>
                    </motion.button>
                  ))}
                </div>
              </Card>
            </FadeIn>
          </div>

          {/* Right Column - Cart */}
          <FadeIn delay={0.3}>
            <Card className="h-fit sticky top-8">
              <CardTitle className="mb-4 flex items-center gap-2">
                <ShoppingCartIcon className="w-5 h-5" />
                Resumo
              </CardTitle>

              {/* Selected Services */}
              <div className="space-y-2 mb-4">
                <p className="text-dark-400 text-sm font-medium">Serviços</p>
                {selectedServices.map((item, index) => (
                  <motion.div
                    key={item.serviceId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between p-2 bg-dark-800 rounded-lg"
                  >
                    <div>
                      <span className="text-white">{getServiceName(item.serviceId)}</span>
                      {item.isMain && <span className="ml-2 text-xs text-primary-500">(Principal)</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">{formatCurrency(item.price)}</span>
                      {!item.isMain && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => removeService(item.serviceId)}
                          className="text-red-500 p-1 hover:bg-dark-700 rounded"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Selected Products */}
              {selectedProducts.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-dark-400 text-sm font-medium">Produtos</p>
                  {selectedProducts.map((item, index) => (
                    <motion.div
                      key={item.productId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-2 bg-dark-800 rounded-lg"
                    >
                      <span className="text-white">{getProductName(item.productId)}</span>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => updateProductQty(item.productId, item.quantity - 1)}
                          className="w-6 h-6 bg-dark-700 rounded text-white flex items-center justify-center hover:bg-dark-600"
                        >
                          <MinusIcon className="w-4 h-4" />
                        </motion.button>
                        <span className="text-white w-6 text-center">{item.quantity}</span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => updateProductQty(item.productId, item.quantity + 1)}
                          className="w-6 h-6 bg-dark-700 rounded text-white flex items-center justify-center hover:bg-dark-600"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </motion.button>
                        <span className="text-green-500 w-20 text-right">{formatCurrency(item.unitPrice * item.quantity)}</span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => removeProduct(item.productId)}
                          className="text-red-500 p-1 hover:bg-dark-700 rounded"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Discount */}
              <div className="space-y-2 mb-4">
                <p className="text-dark-400 text-sm font-medium">Desconto</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Valor (R$)"
                    type="number"
                    min={0}
                    step="0.01"
                    value={discount}
                    onChange={(e) => { setDiscount(Number(e.target.value)); setDiscountPercent(0); }}
                  />
                  <Input
                    label="Percentual (%)"
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => { setDiscountPercent(Number(e.target.value)); setDiscount(0); }}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <Select
                label="Forma de Pagamento"
                options={paymentOptions}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mb-4"
              />

              {/* Notes */}
              <Textarea
                label="Observações"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mb-4"
              />

              {/* Package Discount Info */}
              {appointment.isSubscriptionBased && appointment.subscription?.package && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-3 mb-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-primary-400 text-sm font-medium">Pacote: {appointment.subscription.package.name}</span>
                  </div>
                  <div className="text-xs text-dark-400">
                    Slot {(appointment.subscriptionSlotIndex || 0) + 1} de {appointment.subscription.totalSlots}
                  </div>
                  {Number(appointment.subscription.package.discountAmount) > 0 && (
                    <div className="text-xs text-green-400 mt-1">
                      Desconto do pacote por sessão: {formatCurrency(
                        Number(appointment.subscription.package.discountAmount) / appointment.subscription.totalSlots
                      )}
                    </div>
                  )}
                </motion.div>
              )}

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
                {appointment.isSubscriptionBased &&
                 appointment.subscription?.package &&
                 Number(appointment.subscription.package.discountAmount) > 0 && (
                  <div className="flex justify-between text-xs text-primary-400">
                    <span>+ Desconto pacote (automático)</span>
                    <span>Aplicado pelo sistema</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-white pt-2">
                  <span>Total</span>
                  <AnimatedCurrency value={total} className="text-green-500" />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedServices.length === 0}
                isLoading={isSubmitting}
                className="w-full mt-6"
                size="lg"
              >
                Finalizar Atendimento
              </Button>
            </Card>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}
