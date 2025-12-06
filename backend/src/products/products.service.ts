import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { StockMovementDto, StockMovementType } from './dto/stock-movement.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ============== CATEGORIAS ==============

  async createCategory(createCategoryDto: CreateCategoryDto) {
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

  async removeCategory(id: string) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (category.products.length > 0) {
      throw new BadRequestException(
        'Não é possível excluir categoria com produtos vinculados',
      );
    }

    return this.prisma.productCategory.delete({ where: { id } });
  }

  // ============== PRODUTOS ==============

  async create(createProductDto: CreateProductDto) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    const product = await this.prisma.product.create({
      data: createProductDto,
      include: { category: true },
    });

    // Registrar entrada inicial no estoque
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

  async findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
    categoryId?: string;
    lowStock?: boolean;
  }) {
    const { skip = 0, take = 50, search, categoryId, lowStock } = params || {};

    const where: any = { isActive: true };

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

  async findOne(id: string) {
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
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id);

    if (updateProductDto.categoryId) {
      const category = await this.prisma.productCategory.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete - apenas desativa
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ============== MOVIMENTAÇÃO DE ESTOQUE ==============

  async addStockMovement(productId: string, dto: StockMovementDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    let newQuantity = product.quantity;

    switch (dto.type) {
      case StockMovementType.ENTRY:
        newQuantity += dto.quantity;
        break;
      case StockMovementType.EXIT:
        if (product.quantity < dto.quantity) {
          throw new BadRequestException('Estoque insuficiente');
        }
        newQuantity -= dto.quantity;
        break;
      case StockMovementType.ADJUSTMENT:
        newQuantity = dto.quantity;
        break;
    }

    // Atualizar produto e criar movimento em uma transação
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

  async getStockMovements(productId: string) {
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

  async decreaseStock(
    productId: string,
    quantity: number,
    checkoutId?: string,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (product.quantity < quantity) {
      throw new BadRequestException(
        `Estoque insuficiente para ${product.name}`,
      );
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
}
