import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsNumber,
  IsArray,
  IsEnum,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  TRANSFER = 'TRANSFER',
}

export class CheckoutServiceItem {
  @ApiProperty({ example: 'uuid-do-servico' })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ example: 45.0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  isMain?: boolean;
}

export class CheckoutProductItem {
  @ApiProperty({ example: 'uuid-do-produto' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 45.0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateCheckoutDto {
  @ApiProperty({ example: 'uuid-do-agendamento' })
  @IsUUID()
  @IsNotEmpty()
  appointmentId: string;

  @ApiProperty({ type: [CheckoutServiceItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutServiceItem)
  services: CheckoutServiceItem[];

  @ApiPropertyOptional({ type: [CheckoutProductItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutProductItem)
  @IsOptional()
  products?: CheckoutProductItem[];

  @ApiPropertyOptional({ example: 10.0, description: 'Valor do desconto' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ example: 10, description: 'Percentual de desconto' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercent?: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 'Cliente pagou em 2x no cartão' })
  @IsString()
  @IsOptional()
  notes?: string;
}
