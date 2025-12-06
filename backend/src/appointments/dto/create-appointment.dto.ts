import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateAppointmentDto {
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

  @ApiProperty({ example: '2024-01-15T14:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ example: 'Cliente pediu para não usar máquina' })
  @IsString()
  @IsOptional()
  notes?: string;
}
