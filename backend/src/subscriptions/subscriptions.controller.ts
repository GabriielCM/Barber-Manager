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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PreviewSubscriptionDto } from './dto/preview-subscription.dto';
import {
  UpdateSubscriptionDto,
  PauseSubscriptionDto,
  CancelSubscriptionDto,
} from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('preview')
  @ApiOperation({ summary: 'Gerar prévia de assinatura' })
  preview(@Body() dto: PreviewSubscriptionDto) {
    return this.subscriptionsService.previewSubscription(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Criar assinatura com ajustes opcionais' })
  create(
    @Body() dto: CreateSubscriptionDto,
    @Query('adjustments') adjustments?: string,
  ) {
    const adjustmentsDto = adjustments ? JSON.parse(adjustments) : undefined;
    return this.subscriptionsService.createSubscription(dto, adjustmentsDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar assinaturas com filtros' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiQuery({ name: 'barberId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('clientId') clientId?: string,
    @Query('barberId') barberId?: string,
    @Query('status') status?: string,
  ) {
    return this.subscriptionsService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      clientId,
      barberId,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar assinatura por ID' })
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar assinatura' })
  update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.updateSubscription(id, dto);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pausar assinatura' })
  pause(@Param('id') id: string, @Body() dto: PauseSubscriptionDto) {
    return this.subscriptionsService.pauseSubscription(id, dto);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Retomar assinatura pausada' })
  resume(
    @Param('id') id: string,
    @Body() body: { newStartDate: string; reason?: string },
  ) {
    return this.subscriptionsService.resumeSubscription(
      id,
      body.newStartDate,
      body.reason,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancelar assinatura' })
  cancel(@Param('id') id: string, @Body() dto: CancelSubscriptionDto) {
    return this.subscriptionsService.cancelSubscription(id, dto);
  }
}
