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
import { FinancialService } from './financial.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('financial')
@Controller('financial')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Post('transactions')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar transação financeira (entrada/saída)' })
  createTransaction(@Body() dto: CreateTransactionDto) {
    return this.financialService.createTransaction(dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Listar transações' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  findAllTransactions(
    @Query('skip', ParseOptionalIntPipe) skip?: number,
    @Query('take', ParseOptionalIntPipe) take?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
  ) {
    return this.financialService.findAllTransactions({
      skip,
      take,
      startDate,
      endDate,
      type,
      category,
    });
  }

  @Delete('transactions/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Excluir transação' })
  deleteTransaction(@Param('id') id: string) {
    return this.financialService.deleteTransaction(id);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Estatísticas do dashboard' })
  getDashboardStats() {
    return this.financialService.getDashboardStats();
  }

  @Get('cash-flow/daily')
  @ApiOperation({ summary: 'Fluxo de caixa diário' })
  @ApiQuery({ name: 'date', required: true, type: String })
  getDailyCashFlow(@Query('date') date: string) {
    return this.financialService.getDailyCashFlow(date);
  }

  @Get('cash-flow/weekly')
  @ApiOperation({ summary: 'Fluxo de caixa semanal' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  getWeeklyCashFlow(@Query('startDate') startDate: string) {
    return this.financialService.getWeeklyCashFlow(startDate);
  }

  @Get('cash-flow/monthly')
  @ApiOperation({ summary: 'Fluxo de caixa mensal' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'month', required: true, type: Number })
  getMonthlyCashFlow(
    @Query('year', ParseOptionalIntPipe) year: number,
    @Query('month', ParseOptionalIntPipe) month: number,
  ) {
    return this.financialService.getMonthlyCashFlow(year, month);
  }

  @Get('reports/barber')
  @ApiOperation({ summary: 'Relatório por barbeiro' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  getReportByBarber(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financialService.getReportByBarber(startDate, endDate);
  }

  @Get('reports/client')
  @ApiOperation({ summary: 'Relatório por cliente' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  getReportByClient(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financialService.getReportByClient(startDate, endDate);
  }

  @Get('reports/service')
  @ApiOperation({ summary: 'Relatório por serviço' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  getReportByService(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financialService.getReportByService(startDate, endDate);
  }
}
