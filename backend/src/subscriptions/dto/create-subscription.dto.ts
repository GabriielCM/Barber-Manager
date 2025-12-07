import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export enum SubscriptionPlanType {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
}

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'uuid-do-cliente' })
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ example: 'uuid-do-barbeiro' })
  @IsUUID()
  @IsNotEmpty()
  barberId: string;

  @ApiProperty({ example: 'uuid-do-servico' })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ enum: SubscriptionPlanType, example: 'WEEKLY' })
  @IsEnum(SubscriptionPlanType)
  @IsNotEmpty()
  planType: SubscriptionPlanType;

  @ApiProperty({ example: '2024-12-10T14:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ enum: [1, 3, 6], example: 3 })
  @IsInt()
  @Min(1)
  @Max(6)
  @IsNotEmpty()
  durationMonths: number;

  @ApiPropertyOptional({ example: 'Cliente preferencial' })
  @IsString()
  @IsOptional()
  notes?: string;
}
