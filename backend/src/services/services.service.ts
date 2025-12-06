import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto) {
    return this.prisma.service.create({
      data: createServiceDto,
    });
  }

  async findAll(onlyActive: boolean = true) {
    return this.prisma.service.findMany({
      where: onlyActive ? { isActive: true } : {},
      include: {
        barbers: {
          include: { barber: true },
        },
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        barbers: {
          include: { barber: true },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }

    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    await this.findOne(id);

    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete
    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getServicesByBarber(barberId: string) {
    return this.prisma.service.findMany({
      where: {
        isActive: true,
        barbers: {
          some: { barberId },
        },
      },
    });
  }

  async getPopularServices(limit: number = 5) {
    const services = await this.prisma.service.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { checkoutServices: true },
        },
      },
    });

    return services
      .sort((a, b) => b._count.checkoutServices - a._count.checkoutServices)
      .slice(0, limit);
  }
}
