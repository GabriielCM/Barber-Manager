import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryPackageDto {
  @ApiPropertyOptional({ example: true, description: 'Filtrar por status ativo/inativo' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1) return true;
    if (value === 'false' || value === false || value === 0) return false;
    return undefined;
  })
  isActive?: boolean;
}
