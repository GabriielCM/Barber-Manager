import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { ProductsService } from '../products/products.service';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class CheckoutService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
    private clientsService: ClientsService,
  ) {}

  async create(createCheckoutDto: CreateCheckoutDto) {
    // Buscar agendamento com serviços e subscription/package
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: createCheckoutDto.appointmentId },
      include: {
        client: true,
        barber: true,
        service: true,
        checkout: true,
        appointmentServices: {
          include: {
            service: true,
          },
        },
        subscription: {
          include: {
            package: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (appointment.checkout) {
      throw new BadRequestException('Agendamento já possui checkout');
    }

    // Calcular subtotal de serviços
    const servicesSubtotal = createCheckoutDto.services.reduce(
      (sum, s) => sum + s.price,
      0,
    );

    // Calcular subtotal de produtos
    let productsSubtotal = 0;
    if (createCheckoutDto.products && createCheckoutDto.products.length > 0) {
      // Verificar estoque de todos os produtos
      for (const item of createCheckoutDto.products) {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`Produto ${item.productId} não encontrado`);
        }

        if (product.quantity < item.quantity) {
          throw new BadRequestException(
            `Estoque insuficiente para ${product.name}`,
          );
        }

        productsSubtotal += item.unitPrice * item.quantity;
      }
    }

    const subtotal = servicesSubtotal + productsSubtotal;

    // Validar que não enviou discount e discountPercent ao mesmo tempo
    if (
      createCheckoutDto.discount &&
      createCheckoutDto.discount > 0 &&
      createCheckoutDto.discountPercent &&
      createCheckoutDto.discountPercent > 0
    ) {
      throw new BadRequestException(
        'Não é permitido enviar desconto fixo e percentual ao mesmo tempo',
      );
    }

    // Calcular desconto
    let discount = createCheckoutDto.discount || 0;
    if (createCheckoutDto.discountPercent) {
      discount = subtotal * (createCheckoutDto.discountPercent / 100);
    }

    // Aplicar desconto de pacote se for agendamento de assinatura
    if (appointment.isSubscriptionBased && appointment.subscription?.package) {
      const pkg = appointment.subscription.package;
      const totalSlots = appointment.subscription.totalSlots;

      // Calcular desconto proporcional por agendamento
      const packageDiscountPerAppointment =
        Number(pkg.discountAmount) / totalSlots;

      // Adicionar desconto do pacote ao desconto total
      discount += packageDiscountPerAppointment;
    }

    const total = subtotal - discount;

    // Criar checkout em uma transação
    const checkout = await this.prisma.$transaction(async (tx) => {
      // Criar checkout
      const newCheckout = await tx.checkout.create({
        data: {
          appointmentId: createCheckoutDto.appointmentId,
          clientId: appointment.clientId,
          barberId: appointment.barberId,
          subtotal,
          discount,
          discountPercent: createCheckoutDto.discountPercent || 0,
          total,
          paymentMethod: createCheckoutDto.paymentMethod,
          status: 'COMPLETED',
          notes: createCheckoutDto.notes,
        },
      });

      // Adicionar serviços
      await tx.checkoutService.createMany({
        data: createCheckoutDto.services.map((s) => ({
          checkoutId: newCheckout.id,
          serviceId: s.serviceId,
          price: s.price,
          isMain: s.isMain || false,
        })),
      });

      // Adicionar produtos e baixar estoque
      if (createCheckoutDto.products && createCheckoutDto.products.length > 0) {
        for (const item of createCheckoutDto.products) {
          await tx.checkoutProduct.create({
            data: {
              checkoutId: newCheckout.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.unitPrice * item.quantity,
            },
          });

          // Baixar estoque
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'EXIT',
              quantity: item.quantity,
              previousQty: product!.quantity,
              newQty: product!.quantity - item.quantity,
              reason: 'Venda',
              checkoutId: newCheckout.id,
            },
          });

          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } },
          });
        }
      }

      // Atualizar agendamento
      await tx.appointment.update({
        where: { id: createCheckoutDto.appointmentId },
        data: { status: 'COMPLETED' },
      });

      // Atualizar total gasto do cliente
      await tx.client.update({
        where: { id: appointment.clientId },
        data: { totalSpent: { increment: total } },
      });

      // Criar transação financeira
      await tx.financialTransaction.create({
        data: {
          type: 'INCOME',
          category: 'SERVICE',
          description: `Atendimento - ${appointment.client.name}`,
          amount: total,
          checkoutId: newCheckout.id,
        },
      });

      return newCheckout;
    });

    return this.findOne(checkout.id);
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    startDate?: string;
    endDate?: string;
    barberId?: string;
    clientId?: string;
  }) {
    const { skip = 0, take = 50, startDate, endDate, barberId, clientId } = params || {};

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (barberId) where.barberId = barberId;
    if (clientId) where.clientId = clientId;

    const [checkouts, total] = await Promise.all([
      this.prisma.checkout.findMany({
        where,
        skip,
        take,
        include: {
          client: true,
          barber: true,
          services: { include: { service: true } },
          products: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.checkout.count({ where }),
    ]);

    return { checkouts, total };
  }

  async findOne(id: string) {
    const checkout = await this.prisma.checkout.findUnique({
      where: { id },
      include: {
        appointment: true,
        client: true,
        barber: true,
        services: { include: { service: true } },
        products: { include: { product: true } },
        transactions: true,
      },
    });

    if (!checkout) {
      throw new NotFoundException('Checkout não encontrado');
    }

    return checkout;
  }

  async cancel(id: string) {
    const checkout = await this.findOne(id);

    if (checkout.status === 'CANCELLED') {
      throw new BadRequestException('Checkout já está cancelado');
    }

    await this.prisma.$transaction(async (tx) => {
      // Reverter estoque dos produtos
      for (const item of checkout.products) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'ENTRY',
            quantity: item.quantity,
            previousQty: product!.quantity,
            newQty: product!.quantity + item.quantity,
            reason: 'Cancelamento de venda',
            checkoutId: id,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }

      // Reverter total gasto do cliente
      await tx.client.update({
        where: { id: checkout.clientId },
        data: { totalSpent: { decrement: Number(checkout.total) } },
      });

      // Buscar transação financeira original para preservar description
      const originalTransaction = await tx.financialTransaction.findFirst({
        where: { checkoutId: id },
      });

      // Cancelar transação financeira (preservando description original)
      await tx.financialTransaction.updateMany({
        where: { checkoutId: id },
        data: {
          type: 'EXPENSE',
          description: `CANCELADO - ${originalTransaction?.description || 'Atendimento'}`,
        },
      });

      // Atualizar checkout
      await tx.checkout.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Atualizar agendamento
      await tx.appointment.update({
        where: { id: checkout.appointmentId },
        data: { status: 'CANCELLED' },
      });
    });

    return this.findOne(id);
  }

  async generateReceipt(id: string) {
    const checkout = await this.findOne(id);

    return {
      receiptNumber: `REC-${checkout.id.slice(0, 8).toUpperCase()}`,
      date: checkout.createdAt,
      client: {
        name: checkout.client.name,
        phone: checkout.client.phone,
      },
      barber: checkout.barber.name,
      services: checkout.services.map((s) => ({
        name: s.service.name,
        price: s.price,
      })),
      products: checkout.products.map((p) => ({
        name: p.product.name,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        total: p.total,
      })),
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      total: checkout.total,
      paymentMethod: checkout.paymentMethod,
    };
  }
}
