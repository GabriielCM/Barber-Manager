import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNotEmpty, IsInt, Min, Max, MaxLength } from 'class-validator';
import { SubscriptionPlanType } from './create-subscription.dto';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ enum: SubscriptionPlanType })
  @IsEnum(SubscriptionPlanType, { message: 'Tipo de plano inválido' })
  @IsOptional()
  planType?: SubscriptionPlanType;

  @ApiPropertyOptional()
  @IsString({ message: 'Observações devem ser texto' })
  @IsOptional()
  @MaxLength(500, { message: 'Observações devem ter no máximo 500 caracteres' })
  notes?: string;

  @ApiPropertyOptional({ example: 'Mudança solicitada pelo cliente' })
  @IsString({ message: 'Motivo deve ser texto' })
  @IsOptional()
  @MaxLength(200, { message: 'Motivo deve ter no máximo 200 caracteres' })
  reason?: string;
}

export class PauseSubscriptionDto {
  @ApiPropertyOptional({ example: 'Cliente solicitou pausa temporária' })
  @IsString({ message: 'Motivo deve ser texto' })
  @IsOptional()
  @MaxLength(200, { message: 'Motivo deve ter no máximo 200 caracteres' })
  reason?: string;
}

export class CancelSubscriptionDto {
  @ApiProperty({ example: 'Cliente não deseja mais o serviço' })
  @IsString({ message: 'Motivo deve ser texto' })
  @IsNotEmpty({ message: 'Motivo do cancelamento é obrigatório' })
  @MaxLength(200, { message: 'Motivo deve ter no máximo 200 caracteres' })
  reason: string;
}

export class ExtendSubscriptionDto {
  @ApiProperty({
    description: 'Quantidade de meses para estender a assinatura',
    example: 1,
    minimum: 1,
    maximum: 12,
  })
  @IsInt({ message: 'Quantidade de meses deve ser um número inteiro' })
  @Min(1, { message: 'Extensão mínima é de 1 mês' })
  @Max(12, { message: 'Extensão máxima é de 12 meses' })
  @IsNotEmpty({ message: 'Quantidade de meses é obrigatória' })
  extensionMonths: number;

  @ApiPropertyOptional({ example: 'Cliente solicitou extensão' })
  @IsString({ message: 'Motivo deve ser texto' })
  @IsOptional()
  @MaxLength(200, { message: 'Motivo deve ter no máximo 200 caracteres' })
  reason?: string;
}
