import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
export declare class AppointmentsController {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    create(createAppointmentDto: CreateAppointmentDto): Promise<{
        client: {
            id: string;
            status: import(".prisma/client").$Enums.ClientStatus;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            phone: string;
            email: string | null;
            birthDate: Date | null;
            observations: string | null;
            totalSpent: import("@prisma/client/runtime/library").Decimal;
            noShowCount: number;
        };
        barber: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            phone: string | null;
            email: string | null;
            specialties: string[];
            isActive: boolean;
        };
        service: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isActive: boolean;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            duration: number;
        };
    } & {
        id: string;
        date: Date;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        barberId: string;
        serviceId: string;
    }>;
    findAll(skip?: number, take?: number, date?: string, barberId?: string, clientId?: string, status?: string): Promise<{
        appointments: ({
            client: {
                id: string;
                status: import(".prisma/client").$Enums.ClientStatus;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                phone: string;
                email: string | null;
                birthDate: Date | null;
                observations: string | null;
                totalSpent: import("@prisma/client/runtime/library").Decimal;
                noShowCount: number;
            };
            barber: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                phone: string | null;
                email: string | null;
                specialties: string[];
                isActive: boolean;
            };
            service: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                duration: number;
            };
            checkout: {
                id: string;
                status: import(".prisma/client").$Enums.CheckoutStatus;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                clientId: string;
                barberId: string;
                appointmentId: string;
                subtotal: import("@prisma/client/runtime/library").Decimal;
                discount: import("@prisma/client/runtime/library").Decimal;
                discountPercent: import("@prisma/client/runtime/library").Decimal;
                total: import("@prisma/client/runtime/library").Decimal;
                paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
            } | null;
        } & {
            id: string;
            date: Date;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            clientId: string;
            barberId: string;
            serviceId: string;
        })[];
        total: number;
    }>;
    getTodayAppointments(): Promise<({
        client: {
            id: string;
            status: import(".prisma/client").$Enums.ClientStatus;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            phone: string;
            email: string | null;
            birthDate: Date | null;
            observations: string | null;
            totalSpent: import("@prisma/client/runtime/library").Decimal;
            noShowCount: number;
        };
        barber: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            phone: string | null;
            email: string | null;
            specialties: string[];
            isActive: boolean;
        };
        service: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isActive: boolean;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            duration: number;
        };
        checkout: {
            id: string;
            status: import(".prisma/client").$Enums.CheckoutStatus;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            clientId: string;
            barberId: string;
            appointmentId: string;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            discountPercent: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
        } | null;
    } & {
        id: string;
        date: Date;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        barberId: string;
        serviceId: string;
    })[]>;
    getUpcomingAppointments(barberId?: string): Promise<({
        client: {
            id: string;
            status: import(".prisma/client").$Enums.ClientStatus;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            phone: string;
            email: string | null;
            birthDate: Date | null;
            observations: string | null;
            totalSpent: import("@prisma/client/runtime/library").Decimal;
            noShowCount: number;
        };
        barber: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            phone: string | null;
            email: string | null;
            specialties: string[];
            isActive: boolean;
        };
        service: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isActive: boolean;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            duration: number;
        };
    } & {
        id: string;
        date: Date;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        barberId: string;
        serviceId: string;
    })[]>;
    getCalendarView(startDate: string, endDate: string, barberId?: string): Promise<Record<string, ({
        client: {
            id: string;
            status: import(".prisma/client").$Enums.ClientStatus;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            phone: string;
            email: string | null;
            birthDate: Date | null;
            observations: string | null;
            totalSpent: import("@prisma/client/runtime/library").Decimal;
            noShowCount: number;
        };
        barber: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            phone: string | null;
            email: string | null;
            specialties: string[];
            isActive: boolean;
        };
        service: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isActive: boolean;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            duration: number;
        };
    } & {
        id: string;
        date: Date;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        barberId: string;
        serviceId: string;
    })[]>>;
    findOne(id: string): Promise<{
        client: {
            appointments: ({
                barber: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    phone: string | null;
                    email: string | null;
                    specialties: string[];
                    isActive: boolean;
                };
                service: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    isActive: boolean;
                    description: string | null;
                    price: import("@prisma/client/runtime/library").Decimal;
                    duration: number;
                };
            } & {
                id: string;
                date: Date;
                status: import(".prisma/client").$Enums.AppointmentStatus;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                clientId: string;
                barberId: string;
                serviceId: string;
            })[];
            checkouts: ({
                services: ({
                    service: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        isActive: boolean;
                        description: string | null;
                        price: import("@prisma/client/runtime/library").Decimal;
                        duration: number;
                    };
                } & {
                    id: string;
                    serviceId: string;
                    price: import("@prisma/client/runtime/library").Decimal;
                    checkoutId: string;
                    isMain: boolean;
                })[];
                products: ({
                    product: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        isActive: boolean;
                        description: string | null;
                        quantity: number;
                        categoryId: string;
                        minQuantity: number;
                        costPrice: import("@prisma/client/runtime/library").Decimal;
                        salePrice: import("@prisma/client/runtime/library").Decimal;
                    };
                } & {
                    id: string;
                    total: import("@prisma/client/runtime/library").Decimal;
                    checkoutId: string;
                    productId: string;
                    quantity: number;
                    unitPrice: import("@prisma/client/runtime/library").Decimal;
                })[];
            } & {
                id: string;
                status: import(".prisma/client").$Enums.CheckoutStatus;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                clientId: string;
                barberId: string;
                appointmentId: string;
                subtotal: import("@prisma/client/runtime/library").Decimal;
                discount: import("@prisma/client/runtime/library").Decimal;
                discountPercent: import("@prisma/client/runtime/library").Decimal;
                total: import("@prisma/client/runtime/library").Decimal;
                paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
            })[];
        } & {
            id: string;
            status: import(".prisma/client").$Enums.ClientStatus;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            phone: string;
            email: string | null;
            birthDate: Date | null;
            observations: string | null;
            totalSpent: import("@prisma/client/runtime/library").Decimal;
            noShowCount: number;
        };
        barber: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            phone: string | null;
            email: string | null;
            specialties: string[];
            isActive: boolean;
        };
        service: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isActive: boolean;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            duration: number;
        };
        checkout: ({
            services: ({
                service: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    isActive: boolean;
                    description: string | null;
                    price: import("@prisma/client/runtime/library").Decimal;
                    duration: number;
                };
            } & {
                id: string;
                serviceId: string;
                price: import("@prisma/client/runtime/library").Decimal;
                checkoutId: string;
                isMain: boolean;
            })[];
            products: ({
                product: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    isActive: boolean;
                    description: string | null;
                    quantity: number;
                    categoryId: string;
                    minQuantity: number;
                    costPrice: import("@prisma/client/runtime/library").Decimal;
                    salePrice: import("@prisma/client/runtime/library").Decimal;
                };
            } & {
                id: string;
                total: import("@prisma/client/runtime/library").Decimal;
                checkoutId: string;
                productId: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
            })[];
        } & {
            id: string;
            status: import(".prisma/client").$Enums.CheckoutStatus;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            clientId: string;
            barberId: string;
            appointmentId: string;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            discountPercent: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
        }) | null;
    } & {
        id: string;
        date: Date;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        barberId: string;
        serviceId: string;
    }>;
    update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<{
        client: {
            id: string;
            status: import(".prisma/client").$Enums.ClientStatus;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            phone: string;
            email: string | null;
            birthDate: Date | null;
            observations: string | null;
            totalSpent: import("@prisma/client/runtime/library").Decimal;
            noShowCount: number;
        };
        barber: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            phone: string | null;
            email: string | null;
            specialties: string[];
            isActive: boolean;
        };
        service: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isActive: boolean;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            duration: number;
        };
    } & {
        id: string;
        date: Date;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        barberId: string;
        serviceId: string;
    }>;
    startAppointment(id: string): Promise<{
        id: string;
        date: Date;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        barberId: string;
        serviceId: string;
    }>;
    cancel(id: string): Promise<{
        id: string;
        date: Date;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        barberId: string;
        serviceId: string;
    }>;
}
