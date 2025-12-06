"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const products_service_1 = require("../products/products.service");
const clients_service_1 = require("../clients/clients.service");
let CheckoutService = class CheckoutService {
    constructor(prisma, productsService, clientsService) {
        this.prisma = prisma;
        this.productsService = productsService;
        this.clientsService = clientsService;
    }
    async create(createCheckoutDto) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: createCheckoutDto.appointmentId },
            include: {
                client: true,
                barber: true,
                service: true,
                checkout: true,
            },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Agendamento não encontrado');
        }
        if (appointment.checkout) {
            throw new common_1.BadRequestException('Agendamento já possui checkout');
        }
        const servicesSubtotal = createCheckoutDto.services.reduce((sum, s) => sum + s.price, 0);
        let productsSubtotal = 0;
        if (createCheckoutDto.products && createCheckoutDto.products.length > 0) {
            for (const item of createCheckoutDto.products) {
                const product = await this.prisma.product.findUnique({
                    where: { id: item.productId },
                });
                if (!product) {
                    throw new common_1.NotFoundException(`Produto ${item.productId} não encontrado`);
                }
                if (product.quantity < item.quantity) {
                    throw new common_1.BadRequestException(`Estoque insuficiente para ${product.name}`);
                }
                productsSubtotal += item.unitPrice * item.quantity;
            }
        }
        const subtotal = servicesSubtotal + productsSubtotal;
        let discount = createCheckoutDto.discount || 0;
        if (createCheckoutDto.discountPercent) {
            discount = subtotal * (createCheckoutDto.discountPercent / 100);
        }
        const total = subtotal - discount;
        const checkout = await this.prisma.$transaction(async (tx) => {
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
            await tx.checkoutService.createMany({
                data: createCheckoutDto.services.map((s) => ({
                    checkoutId: newCheckout.id,
                    serviceId: s.serviceId,
                    price: s.price,
                    isMain: s.isMain || false,
                })),
            });
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
                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                    });
                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            type: 'EXIT',
                            quantity: item.quantity,
                            previousQty: product.quantity,
                            newQty: product.quantity - item.quantity,
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
            await tx.appointment.update({
                where: { id: createCheckoutDto.appointmentId },
                data: { status: 'COMPLETED' },
            });
            await tx.client.update({
                where: { id: appointment.clientId },
                data: { totalSpent: { increment: total } },
            });
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
    async findAll(params) {
        const { skip = 0, take = 50, startDate, endDate, barberId, clientId } = params || {};
        const where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        if (barberId)
            where.barberId = barberId;
        if (clientId)
            where.clientId = clientId;
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
    async findOne(id) {
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
            throw new common_1.NotFoundException('Checkout não encontrado');
        }
        return checkout;
    }
    async cancel(id) {
        const checkout = await this.findOne(id);
        if (checkout.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Checkout já está cancelado');
        }
        await this.prisma.$transaction(async (tx) => {
            for (const item of checkout.products) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: 'ENTRY',
                        quantity: item.quantity,
                        previousQty: product.quantity,
                        newQty: product.quantity + item.quantity,
                        reason: 'Cancelamento de venda',
                        checkoutId: id,
                    },
                });
                await tx.product.update({
                    where: { id: item.productId },
                    data: { quantity: { increment: item.quantity } },
                });
            }
            await tx.client.update({
                where: { id: checkout.clientId },
                data: { totalSpent: { decrement: Number(checkout.total) } },
            });
            await tx.financialTransaction.updateMany({
                where: { checkoutId: id },
                data: { type: 'EXPENSE', description: 'CANCELADO - ' },
            });
            await tx.checkout.update({
                where: { id },
                data: { status: 'CANCELLED' },
            });
            await tx.appointment.update({
                where: { id: checkout.appointmentId },
                data: { status: 'CANCELLED' },
            });
        });
        return this.findOne(id);
    }
    async generateReceipt(id) {
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
};
exports.CheckoutService = CheckoutService;
exports.CheckoutService = CheckoutService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        products_service_1.ProductsService,
        clients_service_1.ClientsService])
], CheckoutService);
//# sourceMappingURL=checkout.service.js.map