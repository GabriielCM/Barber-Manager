import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  MaxLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(dateString: string, args: ValidationArguments) {
    const date = new Date(dateString);
    const now = new Date();
    // Permitir agendamentos até 5 minutos no passado (tolerância)
    now.setMinutes(now.getMinutes() - 5);
    return date > now;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Data do agendamento deve ser no futuro';
  }
}

export class CreateAppointmentDto {
  @ApiProperty({ example: 'uuid-do-cliente' })
  @IsUUID('4', { message: 'ID do cliente deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID do cliente é obrigatório' })
  clientId: string;

  @ApiProperty({ example: 'uuid-do-barbeiro' })
  @IsUUID('4', { message: 'ID do barbeiro deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID do barbeiro é obrigatório' })
  barberId: string;

  @ApiProperty({ example: 'uuid-do-servico' })
  @IsUUID('4', { message: 'ID do serviço deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID do serviço é obrigatório' })
  serviceId: string;

  @ApiProperty({ example: '2024-01-15T14:00:00Z' })
  @IsDateString({}, { message: 'Data deve estar no formato ISO 8601' })
  @IsNotEmpty({ message: 'Data é obrigatória' })
  @Validate(IsFutureDateConstraint)
  date: string;

  @ApiPropertyOptional({ example: 'Cliente pediu para não usar máquina' })
  @IsString({ message: 'Observações devem ser texto' })
  @IsOptional()
  @MaxLength(500, { message: 'Observações devem ter no máximo 500 caracteres' })
  notes?: string;
}
