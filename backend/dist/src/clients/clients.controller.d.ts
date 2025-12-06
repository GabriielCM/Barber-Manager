import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
export declare class ClientsController {
    private readonly clientsService;
    constructor(clientsService: ClientsService);
    create(createClientDto: CreateClientDto): Promise<{
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
    }>;
    findAll(skip?: number, take?: number, search?: string, status?: string): Promise<{
        clients: {
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
        }[];
        total: number;
    }>;
    search(query: string): Promise<{
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
    }[]>;
    getVipClients(minTicket?: number): Promise<{
        totalSpent: number;
        ticketMedio: number;
        totalVisits: number;
        checkouts: {
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
        }[];
        id: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        birthDate: Date | null;
        observations: string | null;
        status: import(".prisma/client").$Enums.ClientStatus;
        noShowCount: number;
    }[]>;
    getInactiveClients(days?: number): Promise<({
        appointments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            barberId: string;
            serviceId: string;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            date: Date;
            clientId: string;
            notes: string | null;
        }[];
    } & {
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
    })[]>;
    findOne(id: string): Promise<{
        appointments: ({
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
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            barberId: string;
            serviceId: string;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            date: Date;
            clientId: string;
            notes: string | null;
        })[];
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
    } & {
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
    }>;
    getClientHistory(id: string): Promise<{
        client: {
            id: string;
            name: string;
            phone: string;
            email: string | null;
            status: import(".prisma/client").$Enums.ClientStatus;
            createdAt: Date;
        };
        stats: {
            totalSpent: number;
            ticketMedio: number;
            totalVisits: number;
            visitsThisMonth: number;
            visitsThisYear: number;
            noShowCount: number;
            lastVisit: Date | null;
        };
        barbersWhoServed: {
            id: string;
            email: string | null;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            specialties: string[];
        }[];
        topServices: {
            name: string;
            count: number;
        }[];
        topProducts: {
            name: string;
            count: number;
        }[];
        recentAppointments: ({
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
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            barberId: string;
            serviceId: string;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            date: Date;
            clientId: string;
            notes: string | null;
        })[];
        recentCheckouts: ({
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
    }>;
    update(id: string, updateClientDto: UpdateClientDto): Promise<{
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
    }>;
    remove(id: string): Promise<{
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
    }>;
}
