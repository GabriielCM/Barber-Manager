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
import { ParseOptionalBoolPipe } from '../common/pipes';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BarbersService } from './barbers.service';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('barbers')
@Controller('barbers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BarbersController {
  constructor(private readonly barbersService: BarbersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar barbeiro' })
  create(@Body() createBarberDto: CreateBarberDto) {
    return this.barbersService.create(createBarberDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os barbeiros' })
  @ApiQuery({ name: 'onlyActive', required: false, type: Boolean })
  findAll(@Query('onlyActive', ParseOptionalBoolPipe) onlyActive?: boolean) {
    return this.barbersService.findAll(onlyActive);
  }

  @Get('available')
  @ApiOperation({ summary: 'Listar barbeiros disponíveis para uma data' })
  @ApiQuery({ name: 'date', required: true, type: String })
  @ApiQuery({ name: 'serviceId', required: false, type: String })
  getAvailableBarbers(
    @Query('date') date: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.barbersService.getAvailableBarbers(new Date(date), serviceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar barbeiro por ID' })
  findOne(@Param('id') id: string) {
    return this.barbersService.findOne(id);
  }

  @Get(':id/dashboard')
  @ApiOperation({ summary: 'Dashboard individual do barbeiro' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getDashboard(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.barbersService.getDashboard(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar barbeiro' })
  update(@Param('id') id: string, @Body() updateBarberDto: UpdateBarberDto) {
    return this.barbersService.update(id, updateBarberDto);
  }

  @Post(':id/services/:serviceId')
  @ApiOperation({ summary: 'Vincular serviço ao barbeiro' })
  assignService(
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.barbersService.assignService(id, serviceId);
  }

  @Delete(':id/services/:serviceId')
  @ApiOperation({ summary: 'Desvincular serviço do barbeiro' })
  removeService(
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.barbersService.removeService(id, serviceId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar barbeiro' })
  remove(@Param('id') id: string) {
    return this.barbersService.remove(id);
  }
}
