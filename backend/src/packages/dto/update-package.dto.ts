import { PartialType } from '@nestjs/swagger';
import { CreatePackageDto } from './create-package.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePackageDto extends PartialType(CreatePackageDto) {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
