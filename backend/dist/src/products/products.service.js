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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const stock_movement_dto_1 = require("./dto/stock-movement.dto");
let ProductsService = class ProductsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCategory(createCategoryDto) {
        return this.prisma.productCategory.create({
            data: createCategoryDto,
        });
    }
    async findAllCategories() {
        return this.prisma.productCategory.findMany({
            include: {
                _count: {
                    select: { products: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    async removeCategory(id) {
        const category = await this.prisma.productCategory.findUnique({
            where: { id },
            include: { products: true },
        });
        if (!category) {
            throw new common_1.NotFoundException('Categoria não encontrada');
        }
        if (category.products.length > 0) {
            throw new common_1.BadRequestException('Não é possível excluir categoria com produtos vinculados');
        }
        return this.prisma.productCategory.delete({ where: { id } });
    }
    async create(createProductDto) {
        const category = await this.prisma.productCategory.findUnique({
            where: { id: createProductDto.categoryId },
        });
        if (!category) {
            throw new common_1.NotFoundException('Categoria não encontrada');
        }
        const product = await this.prisma.product.create({
            data: createProductDto,
            include: { category: true },
        });
        if (createProductDto.quantity > 0) {
            await this.prisma.stockMovement.create({
                data: {
                    productId: product.id,
                    type: 'ENTRY',
                    quantity: createProductDto.quantity,
                    previousQty: 0,
                    newQty: createProductDto.quantity,
                    reason: 'Estoque inicial',
                },
            });
        }
        return product;
    }
    async findAll(params) {
        const { skip = 0, take = 50, search, categoryId, lowStock } = params || {};
        const where = { isActive: true };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (categoryId) {
            where.categoryId = categoryId;
        }
        let products = await this.prisma.product.findMany({
            where,
            skip,
            take,
            include: { category: true },
            orderBy: { name: 'asc' },
        });
        if (lowStock) {
            products = products.filter((p) => p.quantity <= p.minQuantity);
        }
        const total = await this.prisma.product.count({ where });
        return { products, total };
    }
    async findOne(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                stockMovements: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        return product;
    }
    async update(id, updateProductDto) {
        await this.findOne(id);
        if (updateProductDto.categoryId) {
            const category = await this.prisma.productCategory.findUnique({
                where: { id: updateProductDto.categoryId },
            });
            if (!category) {
                throw new common_1.NotFoundException('Categoria não encontrada');
            }
        }
        return this.prisma.product.update({
            where: { id },
            data: updateProductDto,
            include: { category: true },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.product.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async addStockMovement(productId, dto) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        let newQuantity = product.quantity;
        switch (dto.type) {
            case stock_movement_dto_1.StockMovementType.ENTRY:
                newQuantity += dto.quantity;
                break;
            case stock_movement_dto_1.StockMovementType.EXIT:
                if (product.quantity < dto.quantity) {
                    throw new common_1.BadRequestException('Estoque insuficiente');
                }
                newQuantity -= dto.quantity;
                break;
            case stock_movement_dto_1.StockMovementType.ADJUSTMENT:
                newQuantity = dto.quantity;
                break;
        }
        const [movement] = await this.prisma.$transaction([
            this.prisma.stockMovement.create({
                data: {
                    productId,
                    type: dto.type,
                    quantity: dto.quantity,
                    previousQty: product.quantity,
                    newQty: newQuantity,
                    reason: dto.reason,
                },
            }),
            this.prisma.product.update({
                where: { id: productId },
                data: { quantity: newQuantity },
            }),
        ]);
        return movement;
    }
    async getStockMovements(productId) {
        return this.prisma.stockMovement.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getLowStockProducts() {
        const products = await this.prisma.product.findMany({
            where: { isActive: true },
            include: { category: true },
        });
        return products.filter((p) => p.quantity <= p.minQuantity);
    }
    async decreaseStock(productId, quantity, checkoutId) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        if (product.quantity < quantity) {
            throw new common_1.BadRequestException(`Estoque insuficiente para ${product.name}`);
        }
        const newQuantity = product.quantity - quantity;
        await this.prisma.$transaction([
            this.prisma.stockMovement.create({
                data: {
                    productId,
                    type: 'EXIT',
                    quantity,
                    previousQty: product.quantity,
                    newQty: newQuantity,
                    reason: 'Venda',
                    checkoutId,
                },
            }),
            this.prisma.product.update({
                where: { id: productId },
                data: { quantity: newQuantity },
            }),
        ]);
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map