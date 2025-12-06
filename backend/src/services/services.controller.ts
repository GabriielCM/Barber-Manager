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
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('services')
@Controller('services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar serviço' })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os serviços' })
  @ApiQuery({ name: 'onlyActive', required: false, type: Boolean })
  findAll(@Query('onlyActive', ParseOptionalBoolPipe) onlyActive?: boolean) {
    return this.servicesService.findAll(onlyActive ?? true);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Listar serviços mais populares' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getPopularServices(@Query('limit', ParseOptionalIntPipe) limit?: number) {
    return this.servicesService.getPopularServices(limit);
  }

  @Get('barber/:barberId')
  @ApiOperation({ summary: 'Listar serviços de um barbeiro' })
  getServicesByBarber(@Param('barberId') barberId: string) {
    return this.servicesService.getServicesByBarber(barberId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar serviço por ID' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar serviço' })
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar serviço' })
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
