"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ServicesService = class ServicesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createServiceDto) {
        return this.prisma.service.create({
            data: createServiceDto,
        });
    }
    async findAll(onlyActive = true) {
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
    async findOne(id) {
        const service = await this.prisma.service.findUnique({
            where: { id },
            include: {
                barbers: {
                    include: { barber: true },
                },
            },
        });
        if (!service) {
            throw new common_1.NotFoundException('Serviço não encontrado');
        }
        return service;
    }
    async update(id, updateServiceDto) {
        await this.findOne(id);
        return this.prisma.service.update({
            where: { id },
            data: updateServiceDto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.service.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async getServicesByBarber(barberId) {
        return this.prisma.service.findMany({
            where: {
                isActive: true,
                barbers: {
                    some: { barberId },
                },
            },
        });
    }
    async getPopularServices(limit = 5) {
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
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServicesService);
//# sourceMappingURL=services.service.js.map