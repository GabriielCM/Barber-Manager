import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsInt,
  IsDateString,
  IsString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AppointmentAdjustment {
  @ApiProperty({ example: 0 })
  @IsInt()
  slotIndex: number;

  @ApiProperty({ example: '2024-12-15T14:00:00Z' })
  @IsDateString()
  newDate: string;

  @ApiProperty({ example: 'Cliente solicitou alteração' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class AdjustAppointmentsDto {
  @ApiProperty({ type: [AppointmentAdjustment] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppointmentAdjustment)
  adjustments: AppointmentAdjustment[];
}
