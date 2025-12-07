import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { SubscriptionPlanType } from './create-subscription.dto';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ enum: SubscriptionPlanType })
  @IsEnum(SubscriptionPlanType)
  @IsOptional()
  planType?: SubscriptionPlanType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'Mudança solicitada pelo cliente' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class PauseSubscriptionDto {
  @ApiPropertyOptional({ example: 'Cliente solicitou pausa temporária' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CancelSubscriptionDto {
  @ApiProperty({ example: 'Cliente não deseja mais o serviço' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
