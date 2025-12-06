import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { StockMovementDto } from './dto/stock-movement.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
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
    findAll(skip?: number, take?: number, search?: string, categoryId?: string, lowStock?: boolean): Promise<{
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
    getStockMovements(id: string): Promise<{
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
    addStockMovement(id: string, stockMovementDto: StockMovementDto): Promise<{
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
}
