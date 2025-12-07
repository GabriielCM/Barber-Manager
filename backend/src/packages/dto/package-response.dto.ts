import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlanType } from './create-package.dto';

export class PackageServiceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  duration: number;
}

export class PackageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ enum: SubscriptionPlanType })
  planType: SubscriptionPlanType;

  @ApiProperty()
  basePrice: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty()
  finalPrice: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: [PackageServiceDto] })
  services: PackageServiceDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
