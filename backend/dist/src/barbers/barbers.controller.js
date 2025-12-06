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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarbersController = void 0;
const common_1 = require("@nestjs/common");
const pipes_1 = require("../common/pipes");
const swagger_1 = require("@nestjs/swagger");
const barbers_service_1 = require("./barbers.service");
const create_barber_dto_1 = require("./dto/create-barber.dto");
const update_barber_dto_1 = require("./dto/update-barber.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let BarbersController = class BarbersController {
    constructor(barbersService) {
        this.barbersService = barbersService;
    }
    create(createBarberDto) {
        return this.barbersService.create(createBarberDto);
    }
    findAll(onlyActive) {
        return this.barbersService.findAll(onlyActive);
    }
    getAvailableBarbers(date, serviceId) {
        return this.barbersService.getAvailableBarbers(new Date(date), serviceId);
    }
    findOne(id) {
        return this.barbersService.findOne(id);
    }
    getDashboard(id, startDate, endDate) {
        return this.barbersService.getDashboard(id, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
    }
    update(id, updateBarberDto) {
        return this.barbersService.update(id, updateBarberDto);
    }
    assignService(id, serviceId) {
        return this.barbersService.assignService(id, serviceId);
    }
    removeService(id, serviceId) {
        return this.barbersService.removeService(id, serviceId);
    }
    remove(id) {
        return this.barbersService.remove(id);
    }
};
exports.BarbersController = BarbersController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar barbeiro' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_barber_dto_1.CreateBarberDto]),
    __metadata("design:returntype", void 0)
], BarbersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos os barbeiros' }),
    (0, swagger_1.ApiQuery)({ name: 'onlyActive', required: false, type: Boolean }),
    __param(0, (0, common_1.Query)('onlyActive', pipes_1.ParseOptionalBoolPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", void 0)
], BarbersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('available'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar barbeiros disponíveis para uma data' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: true, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'serviceId', required: false, type: String }),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, common_1.Query)('serviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BarbersController.prototype, "getAvailableBarbers", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar barbeiro por ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BarbersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Dashboard individual do barbeiro' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], BarbersController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar barbeiro' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_barber_dto_1.UpdateBarberDto]),
    __metadata("design:returntype", void 0)
], BarbersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/services/:serviceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Vincular serviço ao barbeiro' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('serviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BarbersController.prototype, "assignService", null);
__decorate([
    (0, common_1.Delete)(':id/services/:serviceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Desvincular serviço do barbeiro' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('serviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BarbersController.prototype, "removeService", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Desativar barbeiro' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BarbersController.prototype, "remove", null);
exports.BarbersController = BarbersController = __decorate([
    (0, swagger_1.ApiTags)('barbers'),
    (0, common_1.Controller)('barbers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [barbers_service_1.BarbersService])
], BarbersController);
//# sourceMappingURL=barbers.controller.js.map