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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar agendamento' })
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiQuery({ name: 'barberId', required: false, type: String })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(
    @Query('skip', ParseOptionalIntPipe) skip?: number,
    @Query('take', ParseOptionalIntPipe) take?: number,
    @Query('date') date?: string,
    @Query('barberId') barberId?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
  ) {
    return this.appointmentsService.findAll({
      skip,
      take,
      date,
      barberId,
      clientId,
      status,
    });
  }

  @Get('today')
  @ApiOperation({ summary: 'Listar agendamentos de hoje' })
  getTodayAppointments() {
    return this.appointmentsService.getTodayAppointments();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Listar próximos agendamentos' })
  @ApiQuery({ name: 'barberId', required: false, type: String })
  getUpcomingAppointments(@Query('barberId') barberId?: string) {
    return this.appointmentsService.getUpcomingAppointments(barberId);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Visualização de calendário' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'barberId', required: false, type: String })
  getCalendarView(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('barberId') barberId?: string,
  ) {
    return this.appointmentsService.getCalendarView(startDate, endDate, barberId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar agendamento por ID' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar agendamento' })
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Iniciar atendimento' })
  startAppointment(@Param('id') id: string) {
    return this.appointmentsService.startAppointment(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancelar agendamento' })
  cancel(@Param('id') id: string) {
    return this.appointmentsService.cancel(id);
  }
}
