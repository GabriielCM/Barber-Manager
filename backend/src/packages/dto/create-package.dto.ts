import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsUUID,
  IsNumber,
  IsOptional,
  Min,
  ArrayMinSize,
} from 'class-validator';

export enum SubscriptionPlanType {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
}

export class CreatePackageDto {
  @ApiProperty({ example: 'Pacote Completo Mensal' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Pacote com corte, barba e sobrancelha' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: SubscriptionPlanType, example: 'WEEKLY' })
  @IsEnum(SubscriptionPlanType)
  @IsNotEmpty()
  planType: SubscriptionPlanType;

  @ApiProperty({
    type: [String],
    example: ['uuid-servico-1', 'uuid-servico-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1, { message: 'Pelo menos um serviço deve ser selecionado' })
  serviceIds: string[];

  @ApiPropertyOptional({ example: 20.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;
}
