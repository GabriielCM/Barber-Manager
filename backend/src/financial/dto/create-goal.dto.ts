import { IsEnum, IsNumber, IsPositive, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum GoalType {
  REVENUE = 'REVENUE',
  PROFIT = 'PROFIT',
  CLIENTS = 'CLIENTS',
}

export class CreateGoalDto {
  @ApiProperty({ enum: GoalType, description: 'Tipo da meta' })
  @IsEnum(GoalType)
  type: GoalType;

  @ApiProperty({ description: 'Valor alvo da meta' })
  @IsNumber()
  @IsPositive()
  targetValue: number;

  @ApiProperty({ description: 'Mês (1-12)' })
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ description: 'Ano' })
  @IsNumber()
  @Min(2020)
  year: number;
}
