import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Pomada Modeladora' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Pomada para cabelo com fixação forte' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'uuid-da-categoria' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minQuantity?: number;

  @ApiProperty({ example: 25.0 })
  @IsNumber()
  @IsPositive()
  costPrice: number;

  @ApiProperty({ example: 45.0 })
  @IsNumber()
  @IsPositive()
  salePrice: number;
}
