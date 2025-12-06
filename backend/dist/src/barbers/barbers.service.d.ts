import { PrismaService } from '../prisma/prisma.service';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';
export declare class BarbersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createBarberDto: CreateBarberDto): Promise<{
        id: string;
        email: string | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        specialties: string[];
    }>;
    findAll(onlyActive?: boolean): Promise<({
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
            createdAt: Date;
            barberId: string;
            serviceId: string;
        })[];
        _count: {
            appointments: number;
            checkouts: number;
        };
    } & {
        id: string;
        email: string | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        specialties: string[];
    })[]>;
    findOne(id: string): Promise<{
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
            createdAt: Date;
            barberId: string;
            serviceId: string;
        })[];
    } & {
        id: string;
        email: string | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        specialties: string[];
    }>;
    update(id: string, updateBarberDto: UpdateBarberDto): Promise<{
        id: string;
        email: string | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        specialties: string[];
    }>;
    remove(id: string): Promise<{
        id: string;
        email: string | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        specialties: string[];
    }>;
    assignService(barberId: string, serviceId: string): Promise<{
        id: string;
        createdAt: Date;
        barberId: string;
        serviceId: string;
    }>;
    removeService(barberId: string, serviceId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getDashboard(barberId: string, startDate?: Date, endDate?: Date): Promise<{
        barber: {
            id: string;
            name: string;
            specialties: string[];
        };
        stats: {
            totalRevenue: number;
            totalAppointments: number;
            averageTicket: number;
        };
        topServices: {
            name: string;
            count: number;
            revenue: number;
        }[];
        monthlyStats: Record<string, {
            revenue: number;
            count: number;
        }>;
    }>;
    getAvailableBarbers(date: Date, serviceId?: string): Promise<{
        busySlots: {
            start: Date;
            end: Date;
        }[];
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
        id: string;
        email: string | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        specialties: string[];
    }[]>;
}
