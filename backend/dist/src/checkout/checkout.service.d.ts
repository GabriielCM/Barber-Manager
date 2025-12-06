import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { ProductsService } from '../products/products.service';
import { ClientsService } from '../clients/clients.service';
export declare class CheckoutService {
    private prisma;
    private productsService;
    private clientsService;
    constructor(prisma: PrismaService, productsService: ProductsService, clientsService: ClientsService);
    create(createCheckoutDto: CreateCheckoutDto): Promise<{
        products: ({
            product: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                quantity: number;
                minQuantity: number;
                costPrice: import("@prisma/client/runtime/library").Decimal;
                salePrice: import("@prisma/client/runtime/library").Decimal;
                categoryId: string;
            };
        } & {
            id: string;
            quantity: number;
            total: import("@prisma/client/runtime/library").Decimal;
            checkoutId: string;
            productId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
        })[];
        services: ({
            service: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                duration: number;
            };
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            serviceId: string;
            checkoutId: string;
            isMain: boolean;
        })[];
        barber: {
            id: string;
            email: string | null;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            specialties: string[];
        };
        client: {
            id: string;
            email: string | null;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string;
            birthDate: Date | null;
            observations: string | null;
            status: import(".prisma/client").$Enums.ClientStatus;
            totalSpent: import("@prisma/client/runtime/library").Decimal;
            noShowCount: number;
        };
        appointment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            barberId: string;
            serviceId: string;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            date: Date;
            clientId: string;
            notes: string | null;
        };
        transactions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            category: import(".prisma/client").$Enums.TransactionCategory;
            type: import(".prisma/client").$Enums.TransactionType;
            date: Date;
            checkoutId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        barberId: string;
        status: import(".prisma/client").$Enums.CheckoutStatus;
        total: import("@prisma/client/runtime/library").Decimal;
        appointmentId: string;
        clientId: string;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        discountPercent: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
        notes: string | null;
    }>;
    findAll(params?: {
        skip?: number;
        take?: number;
        startDate?: string;
        endDate?: string;
        barberId?: string;
        clientId?: string;
    }): Promise<{
        checkouts: ({
            products: ({
                product: {
                    id: string;
                    name: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                    quantity: number;
                    minQuantity: number;
                    costPrice: import("@prisma/client/runtime/library").Decimal;
                    salePrice: import("@prisma/client/runtime/library").Decimal;
                    categoryId: string;
                };
            } & {
                id: string;
                quantity: number;
                total: import("@prisma/client/runtime/library").Decimal;
                checkoutId: string;
                productId: string;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
            })[];
            services: ({
                service: {
                    id: string;
                    name: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                    price: import("@prisma/client/runtime/library").Decimal;
                    duration: number;
                };
            } & {
                id: string;
                price: import("@prisma/client/runtime/library").Decimal;
                serviceId: string;
                checkoutId: string;
                isMain: boolean;
            })[];
            barber: {
                id: string;
                email: string | null;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                phone: string | null;
                specialties: string[];
            };
            client: {
                id: string;
                email: string | null;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                phone: string;
                birthDate: Date | null;
                observations: string | null;
                status: import(".prisma/client").$Enums.ClientStatus;
                totalSpent: import("@prisma/client/runtime/library").Decimal;
                noShowCount: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            barberId: string;
            status: import(".prisma/client").$Enums.CheckoutStatus;
            total: import("@prisma/client/runtime/library").Decimal;
            appointmentId: string;
            clientId: string;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            discountPercent: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
            notes: string | null;
        })[];
        total: number;
    }>;
    findOne(id: string): Promise<{
        products: ({
            product: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                quantity: number;
                minQuantity: number;
                costPrice: import("@prisma/client/runtime/library").Decimal;
                salePrice: import("@prisma/client/runtime/library").Decimal;
                categoryId: string;
            };
        } & {
            id: string;
            quantity: number;
            total: import("@prisma/client/runtime/library").Decimal;
            checkoutId: string;
            productId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
        })[];
        services: ({
            service: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                duration: number;
            };
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            serviceId: string;
            checkoutId: string;
            isMain: boolean;
        })[];
        barber: {
            id: string;
            email: string | null;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            specialties: string[];
        };
        client: {
            id: string;
            email: string | null;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string;
            birthDate: Date | null;
            observations: string | null;
            status: import(".prisma/client").$Enums.ClientStatus;
            totalSpent: import("@prisma/client/runtime/library").Decimal;
            noShowCount: number;
        };
        appointment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            barberId: string;
            serviceId: string;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            date: Date;
            clientId: string;
            notes: string | null;
        };
        transactions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            category: import(".prisma/client").$Enums.TransactionCategory;
            type: import(".prisma/client").$Enums.TransactionType;
            date: Date;
            checkoutId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        barberId: string;
        status: import(".prisma/client").$Enums.CheckoutStatus;
        total: import("@prisma/client/runtime/library").Decimal;
        appointmentId: string;
        clientId: string;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        discountPercent: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
        notes: string | null;
    }>;
    cancel(id: string): Promise<{
        products: ({
            product: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                quantity: number;
                minQuantity: number;
                costPrice: import("@prisma/client/runtime/library").Decimal;
                salePrice: import("@prisma/client/runtime/library").Decimal;
                categoryId: string;
            };
        } & {
            id: string;
            quantity: number;
            total: import("@prisma/client/runtime/library").Decimal;
            checkoutId: string;
            productId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
        })[];
        services: ({
            service: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                duration: number;
            };
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            serviceId: string;
            checkoutId: string;
            isMain: boolean;
        })[];
        barber: {
            id: string;
            email: string | null;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            specialties: string[];
        };
        client: {
            id: string;
            email: string | null;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string;
            birthDate: Date | null;
            observations: string | null;
            status: import(".prisma/client").$Enums.ClientStatus;
            totalSpent: import("@prisma/client/runtime/library").Decimal;
            noShowCount: number;
        };
        appointment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            barberId: string;
            serviceId: string;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            date: Date;
            clientId: string;
            notes: string | null;
        };
        transactions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            category: import(".prisma/client").$Enums.TransactionCategory;
            type: import(".prisma/client").$Enums.TransactionType;
            date: Date;
            checkoutId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        barberId: string;
        status: import(".prisma/client").$Enums.CheckoutStatus;
        total: import("@prisma/client/runtime/library").Decimal;
        appointmentId: string;
        clientId: string;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        discountPercent: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
        notes: string | null;
    }>;
    generateReceipt(id: string): Promise<{
        receiptNumber: string;
        date: Date;
        client: {
            name: string;
            phone: string;
        };
        barber: string;
        services: {
            name: string;
            price: import("@prisma/client/runtime/library").Decimal;
        }[];
        products: {
            name: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
        }[];
        subtotal: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
    }>;
}
