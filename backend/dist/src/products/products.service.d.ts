import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { StockMovementDto } from './dto/stock-movement.dto';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    createCategory(createCategoryDto: CreateCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAllCategories(): Promise<({
        _count: {
            products: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    removeCategory(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(createProductDto: CreateProductDto): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
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
    }>;
    findAll(params?: {
        skip?: number;
        take?: number;
        search?: string;
        categoryId?: string;
        lowStock?: boolean;
    }): Promise<{
        products: ({
            category: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
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
        })[];
        total: number;
    }>;
    findOne(id: string): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
        };
        stockMovements: {
            id: string;
            createdAt: Date;
            quantity: number;
            type: import(".prisma/client").$Enums.StockMovementType;
            checkoutId: string | null;
            productId: string;
            reason: string | null;
            previousQty: number;
            newQty: number;
        }[];
    } & {
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
    }>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
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
    }>;
    remove(id: string): Promise<{
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
    }>;
    addStockMovement(productId: string, dto: StockMovementDto): Promise<{
        id: string;
        createdAt: Date;
        quantity: number;
        type: import(".prisma/client").$Enums.StockMovementType;
        checkoutId: string | null;
        productId: string;
        reason: string | null;
        previousQty: number;
        newQty: number;
    }>;
    getStockMovements(productId: string): Promise<{
        id: string;
        createdAt: Date;
        quantity: number;
        type: import(".prisma/client").$Enums.StockMovementType;
        checkoutId: string | null;
        productId: string;
        reason: string | null;
        previousQty: number;
        newQty: number;
    }[]>;
    getLowStockProducts(): Promise<({
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
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
    })[]>;
    decreaseStock(productId: string, quantity: number, checkoutId?: string): Promise<void>;
}
