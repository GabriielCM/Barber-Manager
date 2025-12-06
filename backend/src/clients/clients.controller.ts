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
import { ParseOptionalIntPipe } from '../common/pipes';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('clients')
@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo cliente' })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os clientes' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(
    @Query('skip', ParseOptionalIntPipe) skip?: number,
    @Query('take', ParseOptionalIntPipe) take?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.clientsService.findAll({ skip, take, search, status });
  }

  @Get('search')
  @ApiOperation({ summary: 'Busca rápida de clientes por nome ou telefone' })
  @ApiQuery({ name: 'q', required: true, type: String })
  search(@Query('q') query: string) {
    return this.clientsService.search(query);
  }

  @Get('vip')
  @ApiOperation({ summary: 'Listar clientes VIP (ticket médio alto)' })
  @ApiQuery({ name: 'minTicket', required: false, type: Number })
  getVipClients(@Query('minTicket', ParseOptionalIntPipe) minTicket?: number) {
    return this.clientsService.getVipClients(minTicket);
  }

  @Get('inactive')
  @ApiOperation({ summary: 'Listar clientes inativos/perdidos' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getInactiveClients(@Query('days', ParseOptionalIntPipe) days?: number) {
    return this.clientsService.getInactiveClients(days);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Obter histórico completo do cliente' })
  getClientHistory(@Param('id') id: string) {
    return this.clientsService.getClientHistory(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover cliente' })
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
