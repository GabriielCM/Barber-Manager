import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParseOptionalIntPipe } from '../common/pipes';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('checkout')
@Controller('checkout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @ApiOperation({ summary: 'Criar checkout (finalizar atendimento)' })
  create(@Body() createCheckoutDto: CreateCheckoutDto) {
    return this.checkoutService.create(createCheckoutDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar checkouts' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'barberId', required: false, type: String })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  findAll(
    @Query('skip', ParseOptionalIntPipe) skip?: number,
    @Query('take', ParseOptionalIntPipe) take?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('barberId') barberId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.checkoutService.findAll({
      skip,
      take,
      startDate,
      endDate,
      barberId,
      clientId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar checkout por ID' })
  findOne(@Param('id') id: string) {
    return this.checkoutService.findOne(id);
  }

  @Get(':id/receipt')
  @ApiOperation({ summary: 'Gerar recibo do checkout' })
  generateReceipt(@Param('id') id: string) {
    return this.checkoutService.generateReceipt(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancelar checkout' })
  cancel(@Param('id') id: string) {
    return this.checkoutService.cancel(id);
  }
}
