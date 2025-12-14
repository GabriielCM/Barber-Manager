import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  IsUUID,
  IsInt,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Pomada Modeladora' })
  @IsString({ message: 'Nome deve ser texto' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @ApiPropertyOptional({ example: 'Pomada para cabelo com fixação forte' })
  @IsString({ message: 'Descrição deve ser texto' })
  @IsOptional()
  @MaxLength(500, { message: 'Descrição deve ter no máximo 500 caracteres' })
  description?: string;

  @ApiProperty({ example: 'uuid-da-categoria' })
  @IsUUID('4', { message: 'ID da categoria deve ser um UUID válido' })
  @IsNotEmpty({ message: 'Categoria é obrigatória' })
  categoryId: string;

  @ApiProperty({ example: 50 })
  @IsInt({ message: 'Quantidade deve ser um número inteiro' })
  @Min(0, { message: 'Quantidade não pode ser negativa' })
  quantity: number;

  @ApiPropertyOptional({ example: 5 })
  @IsInt({ message: 'Quantidade mínima deve ser um número inteiro' })
  @Min(0, { message: 'Quantidade mínima não pode ser negativa' })
  @IsOptional()
  minQuantity?: number;

  @ApiProperty({ example: 25.0 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Preço de custo deve ter no máximo 2 casas decimais' })
  @IsPositive({ message: 'Preço de custo deve ser maior que zero' })
  costPrice: number;

  @ApiProperty({ example: 45.0 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Preço de venda deve ter no máximo 2 casas decimais' })
  @IsPositive({ message: 'Preço de venda deve ser maior que zero' })
  salePrice: number;
}
