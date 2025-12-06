import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParseOptionalIntPipe, ParseOptionalBoolPipe } from '../common/pipes';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { StockMovementDto } from './dto/stock-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ============== CATEGORIAS ==============

  @Post('categories')
  @ApiOperation({ summary: 'Criar categoria de produto' })
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.productsService.createCategory(createCategoryDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Listar todas as categorias' })
  findAllCategories() {
    return this.productsService.findAllCategories();
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Remover categoria' })
  removeCategory(@Param('id') id: string) {
    return this.productsService.removeCategory(id);
  }

  // ============== PRODUTOS ==============

  @Post()
  @ApiOperation({ summary: 'Criar produto' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os produtos' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'lowStock', required: false, type: Boolean })
  findAll(
    @Query('skip', ParseOptionalIntPipe) skip?: number,
    @Query('take', ParseOptionalIntPipe) take?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('lowStock', ParseOptionalBoolPipe) lowStock?: boolean,
  ) {
    return this.productsService.findAll({
      skip,
      take,
      search,
      categoryId,
      lowStock,
    });
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Listar produtos com estoque baixo' })
  getLowStockProducts() {
    return this.productsService.getLowStockProducts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/movements')
  @ApiOperation({ summary: 'Listar movimentações de estoque do produto' })
  getStockMovements(@Param('id') id: string) {
    return this.productsService.getStockMovements(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar produto' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Post(':id/stock')
  @ApiOperation({ summary: 'Registrar movimentação de estoque' })
  addStockMovement(
    @Param('id') id: string,
    @Body() stockMovementDto: StockMovementDto,
  ) {
    return this.productsService.addStockMovement(id, stockMovementDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar produto' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
