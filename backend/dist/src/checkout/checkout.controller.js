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
exports.CheckoutController = void 0;
const common_1 = require("@nestjs/common");
const pipes_1 = require("../common/pipes");
const swagger_1 = require("@nestjs/swagger");
const checkout_service_1 = require("./checkout.service");
const create_checkout_dto_1 = require("./dto/create-checkout.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let CheckoutController = class CheckoutController {
    constructor(checkoutService) {
        this.checkoutService = checkoutService;
    }
    create(createCheckoutDto) {
        return this.checkoutService.create(createCheckoutDto);
    }
    findAll(skip, take, startDate, endDate, barberId, clientId) {
        return this.checkoutService.findAll({
            skip,
            take,
            startDate,
            endDate,
            barberId,
            clientId,
        });
    }
    findOne(id) {
        return this.checkoutService.findOne(id);
    }
    generateReceipt(id) {
        return this.checkoutService.generateReceipt(id);
    }
    cancel(id) {
        return this.checkoutService.cancel(id);
    }
};
exports.CheckoutController = CheckoutController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar checkout (finalizar atendimento)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_checkout_dto_1.CreateCheckoutDto]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar checkouts' }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'barberId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'clientId', required: false, type: String }),
    __param(0, (0, common_1.Query)('skip', pipes_1.ParseOptionalIntPipe)),
    __param(1, (0, common_1.Query)('take', pipes_1.ParseOptionalIntPipe)),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Query)('barberId')),
    __param(5, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar checkout por ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/receipt'),
    (0, swagger_1.ApiOperation)({ summary: 'Gerar recibo do checkout' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "generateReceipt", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar checkout' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "cancel", null);
exports.CheckoutController = CheckoutController = __decorate([
    (0, swagger_1.ApiTags)('checkout'),
    (0, common_1.Controller)('checkout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [checkout_service_1.CheckoutService])
], CheckoutController);
//# sourceMappingURL=checkout.controller.js.map