import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
    create(createServiceDto: CreateServiceDto): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        duration: number;
    }>;
    findAll(onlyActive?: boolean): Promise<({
        barbers: ({
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
            barberId: string;
            serviceId: string;
        })[];
        _count: {
            appointments: number;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        duration: number;
    })[]>;
    getPopularServices(limit?: number): Promise<({
        _count: {
            checkoutServices: number;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        duration: number;
    })[]>;
    getServicesByBarber(barberId: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        duration: number;
    }[]>;
    findOne(id: string): Promise<{
        barbers: ({
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
            barberId: string;
            serviceId: string;
        })[];
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        duration: number;
    }>;
    update(id: string, updateServiceDto: UpdateServiceDto): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        duration: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        duration: number;
    }>;
}
