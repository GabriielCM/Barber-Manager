import { Controller, Get, Post, Delete, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseOptionalIntPipe } from '../common/pipes/parse-optional-int.pipe';

@ApiTags('WhatsApp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get WhatsApp connection status' })
  async getStatus() {
    return this.whatsappService.getStatus();
  }

  @Get('qr')
  @ApiOperation({ summary: 'Get current QR code for connection' })
  async getQrCode() {
    const qrCode = this.whatsappService.getQrCode();
    return {
      qrCode,
      available: !!qrCode,
    };
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize WhatsApp connection' })
  async initialize() {
    await this.whatsappService.initialize();
    return {
      message: 'WhatsApp initialization started',
      success: true,
    };
  }

  @Post('disconnect')
  @ApiOperation({ summary: 'Disconnect WhatsApp client' })
  async disconnect() {
    await this.whatsappService.disconnect();
    return {
      message: 'WhatsApp disconnected successfully',
      success: true,
    };
  }

  @Post('send')
  @ApiOperation({ summary: 'Send manual WhatsApp message' })
  async sendMessage(
    @Body() body: { phoneNumber: string; message: string },
  ) {
    const result = await this.whatsappService.sendMessage(
      body.phoneNumber,
      body.message,
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      messageId: result.messageId,
      message: 'Message sent successfully',
    };
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get WhatsApp logs with pagination' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'level', required: false, type: String })
  async getLogs(
    @Query('skip', ParseOptionalIntPipe) skip?: number,
    @Query('take', ParseOptionalIntPipe) take?: number,
    @Query('level') level?: string,
  ) {
    return this.whatsappService.getLogs(skip, take, level);
  }

  @Delete('logs/clear')
  @ApiOperation({ summary: 'Clear old WhatsApp logs (older than 30 days)' })
  async clearOldLogs() {
    const count = await this.whatsappService.clearOldLogs();
    return {
      message: `Cleared ${count} old logs`,
      count,
    };
  }
}
