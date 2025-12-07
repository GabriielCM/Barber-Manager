import { Controller, Get, Post, Query, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseOptionalIntPipe } from '../common/pipes/parse-optional-int.pipe';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all notifications with filters' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  findAll(
    @Query('skip', ParseOptionalIntPipe) skip?: number,
    @Query('take', ParseOptionalIntPipe) take?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.notificationsService.findAll({
      skip,
      take,
      startDate,
      endDate,
      status,
      type,
      clientId,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  getStats() {
    return this.notificationsService.getStats();
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get notification history for a specific client' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  getClientHistory(
    @Param('clientId') clientId: string,
    @Query('skip', ParseOptionalIntPipe) skip?: number,
    @Query('take', ParseOptionalIntPipe) take?: number,
  ) {
    return this.notificationsService.findAll({
      clientId,
      skip,
      take,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification details by ID' })
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Post('manual')
  @ApiOperation({ summary: 'Send manual message to client' })
  sendManual(
    @Body() body: { clientId: string; message: string },
  ) {
    return this.notificationsService.sendManualMessage(body);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed notification' })
  retry(@Param('id') id: string) {
    return this.notificationsService.retryNotification(id);
  }

  @Post('process-pending')
  @ApiOperation({ summary: 'Manually trigger processing of pending notifications' })
  async processPending() {
    const count = await this.notificationsService.processPendingNotifications();
    return {
      message: `Processed ${count} pending notifications`,
      count,
    };
  }

  @Post('process-scheduled')
  @ApiOperation({ summary: 'Manually trigger processing of scheduled notifications' })
  async processScheduled() {
    const count = await this.notificationsService.processScheduledNotifications();
    return {
      message: `Processed ${count} scheduled notifications`,
      count,
    };
  }
}
