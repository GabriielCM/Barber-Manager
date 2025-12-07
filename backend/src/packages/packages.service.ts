import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { QueryPackageDto } from './dto/query-package.dto';
import { PackageResponseDto } from './dto/package-response.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  async create(createPackageDto: CreatePackageDto): Promise<PackageResponseDto> {
    // Validate that all services exist
    const services = await this.prisma.service.findMany({
      where: {
        id: { in: createPackageDto.serviceIds },
        isActive: true,
      },
    });

    if (services.length !== createPackageDto.serviceIds.length) {
      throw new BadRequestException(
        'Um ou mais serviços não foram encontrados ou estão inativos',
      );
    }

    // Calculate basePrice
    const basePrice = services.reduce(
      (sum, service) => sum + Number(service.price),
      0,
    );

    // Calculate finalPrice
    const discountAmount = createPackageDto.discountAmount || 0;
    const finalPrice = basePrice - discountAmount;

    if (finalPrice < 0) {
      throw new BadRequestException(
        'O desconto não pode ser maior que o preço base',
      );
    }

    // Create package with services in transaction
    const newPackage = await this.prisma.package.create({
      data: {
        name: createPackageDto.name,
        description: createPackageDto.description,
        planType: createPackageDto.planType,
        basePrice: new Decimal(basePrice),
        discountAmount: new Decimal(discountAmount),
        finalPrice: new Decimal(finalPrice),
        services: {
          create: createPackageDto.serviceIds.map((serviceId) => ({
            serviceId,
          })),
        },
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    return this.mapToResponseDto(newPackage);
  }

  async findAll(query: QueryPackageDto): Promise<PackageResponseDto[]> {
    const packages = await this.prisma.package.findMany({
      where: {
        ...(query.isActive !== undefined && { isActive: query.isActive }),
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return packages.map((pkg) => this.mapToResponseDto(pkg));
  }

  async findOne(id: string): Promise<PackageResponseDto> {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundException('Pacote não encontrado');
    }

    return this.mapToResponseDto(pkg);
  }

  async update(
    id: string,
    updatePackageDto: UpdatePackageDto,
  ): Promise<PackageResponseDto> {
    // Check if package exists
    const existingPackage = await this.prisma.package.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!existingPackage) {
      throw new NotFoundException('Pacote não encontrado');
    }

    let basePrice = Number(existingPackage.basePrice);
    let discountAmount = Number(existingPackage.discountAmount);

    // If serviceIds changed, recalculate basePrice
    if (updatePackageDto.serviceIds) {
      const services = await this.prisma.service.findMany({
        where: {
          id: { in: updatePackageDto.serviceIds },
          isActive: true,
        },
      });

      if (services.length !== updatePackageDto.serviceIds.length) {
        throw new BadRequestException(
          'Um ou mais serviços não foram encontrados ou estão inativos',
        );
      }

      basePrice = services.reduce(
        (sum, service) => sum + Number(service.price),
        0,
      );
    }

    // If discountAmount changed, use new value
    if (updatePackageDto.discountAmount !== undefined) {
      discountAmount = updatePackageDto.discountAmount;
    }

    const finalPrice = basePrice - discountAmount;

    if (finalPrice < 0) {
      throw new BadRequestException(
        'O desconto não pode ser maior que o preço base',
      );
    }

    // Update package in transaction
    const updatedPackage = await this.prisma.$transaction(async (tx) => {
      // If services changed, delete old and create new
      if (updatePackageDto.serviceIds) {
        await tx.packageService.deleteMany({
          where: { packageId: id },
        });

        await tx.packageService.createMany({
          data: updatePackageDto.serviceIds.map((serviceId) => ({
            packageId: id,
            serviceId,
          })),
        });
      }

      // Update package
      return tx.package.update({
        where: { id },
        data: {
          ...(updatePackageDto.name && { name: updatePackageDto.name }),
          ...(updatePackageDto.description !== undefined && {
            description: updatePackageDto.description,
          }),
          ...(updatePackageDto.planType && {
            planType: updatePackageDto.planType,
          }),
          ...(updatePackageDto.isActive !== undefined && {
            isActive: updatePackageDto.isActive,
          }),
          basePrice: new Decimal(basePrice),
          discountAmount: new Decimal(discountAmount),
          finalPrice: new Decimal(finalPrice),
        },
        include: {
          services: {
            include: {
              service: true,
            },
          },
        },
      });
    });

    // TODO: Propagate changes to active subscriptions
    // This will be implemented in the package-change-propagation service

    return this.mapToResponseDto(updatedPackage);
  }

  async deactivate(id: string): Promise<PackageResponseDto> {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
      include: {
        subscriptions: {
          where: {
            status: { in: ['ACTIVE', 'PAUSED'] },
          },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundException('Pacote não encontrado');
    }

    if (pkg.subscriptions.length > 0) {
      throw new BadRequestException(
        `Não é possível desativar este pacote pois existem ${pkg.subscriptions.length} assinatura(s) ativa(s) vinculada(s)`,
      );
    }

    const deactivatedPackage = await this.prisma.package.update({
      where: { id },
      data: { isActive: false },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    return this.mapToResponseDto(deactivatedPackage);
  }

  async countActiveSubscriptions(packageId: string): Promise<number> {
    return this.prisma.subscription.count({
      where: {
        packageId,
        status: { in: ['ACTIVE', 'PAUSED'] },
      },
    });
  }

  private mapToResponseDto(pkg: any): PackageResponseDto {
    return {
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      planType: pkg.planType,
      basePrice: Number(pkg.basePrice),
      discountAmount: Number(pkg.discountAmount),
      finalPrice: Number(pkg.finalPrice),
      isActive: pkg.isActive,
      services: pkg.services.map((ps: any) => ({
        id: ps.service.id,
        name: ps.service.name,
        price: Number(ps.service.price),
        duration: ps.service.duration,
      })),
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
    };
  }
}
