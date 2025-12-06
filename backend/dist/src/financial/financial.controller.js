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
exports.FinancialController = void 0;
const common_1 = require("@nestjs/common");
const pipes_1 = require("../common/pipes");
const swagger_1 = require("@nestjs/swagger");
const financial_service_1 = require("./financial.service");
const create_transaction_dto_1 = require("./dto/create-transaction.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let FinancialController = class FinancialController {
    constructor(financialService) {
        this.financialService = financialService;
    }
    createTransaction(dto) {
        return this.financialService.createTransaction(dto);
    }
    findAllTransactions(skip, take, startDate, endDate, type, category) {
        return this.financialService.findAllTransactions({
            skip,
            take,
            startDate,
            endDate,
            type,
            category,
        });
    }
    deleteTransaction(id) {
        return this.financialService.deleteTransaction(id);
    }
    getDashboardStats() {
        return this.financialService.getDashboardStats();
    }
    getDailyCashFlow(date) {
        return this.financialService.getDailyCashFlow(date);
    }
    getWeeklyCashFlow(startDate) {
        return this.financialService.getWeeklyCashFlow(startDate);
    }
    getMonthlyCashFlow(year, month) {
        return this.financialService.getMonthlyCashFlow(year, month);
    }
    getReportByBarber(startDate, endDate) {
        return this.financialService.getReportByBarber(startDate, endDate);
    }
    getReportByClient(startDate, endDate) {
        return this.financialService.getReportByClient(startDate, endDate);
    }
    getReportByService(startDate, endDate) {
        return this.financialService.getReportByService(startDate, endDate);
    }
};
exports.FinancialController = FinancialController;
__decorate([
    (0, common_1.Post)('transactions'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar transação financeira (entrada/saída)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_transaction_dto_1.CreateTransactionDto]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar transações' }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, type: String }),
    __param(0, (0, common_1.Query)('skip', pipes_1.ParseOptionalIntPipe)),
    __param(1, (0, common_1.Query)('take', pipes_1.ParseOptionalIntPipe)),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Query)('type')),
    __param(5, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "findAllTransactions", null);
__decorate([
    (0, common_1.Delete)('transactions/:id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir transação' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "deleteTransaction", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Estatísticas do dashboard' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('cash-flow/daily'),
    (0, swagger_1.ApiOperation)({ summary: 'Fluxo de caixa diário' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: true, type: String }),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "getDailyCashFlow", null);
__decorate([
    (0, common_1.Get)('cash-flow/weekly'),
    (0, swagger_1.ApiOperation)({ summary: 'Fluxo de caixa semanal' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, type: String }),
    __param(0, (0, common_1.Query)('startDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "getWeeklyCashFlow", null);
__decorate([
    (0, common_1.Get)('cash-flow/monthly'),
    (0, swagger_1.ApiOperation)({ summary: 'Fluxo de caixa mensal' }),
    (0, swagger_1.ApiQuery)({ name: 'year', required: true, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'month', required: true, type: Number }),
    __param(0, (0, common_1.Query)('year', pipes_1.ParseOptionalIntPipe)),
    __param(1, (0, common_1.Query)('month', pipes_1.ParseOptionalIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "getMonthlyCashFlow", null);
__decorate([
    (0, common_1.Get)('reports/barber'),
    (0, swagger_1.ApiOperation)({ summary: 'Relatório por barbeiro' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, type: String }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "getReportByBarber", null);
__decorate([
    (0, common_1.Get)('reports/client'),
    (0, swagger_1.ApiOperation)({ summary: 'Relatório por cliente' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, type: String }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "getReportByClient", null);
__decorate([
    (0, common_1.Get)('reports/service'),
    (0, swagger_1.ApiOperation)({ summary: 'Relatório por serviço' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, type: String }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "getReportByService", null);
exports.FinancialController = FinancialController = __decorate([
    (0, swagger_1.ApiTags)('financial'),
    (0, common_1.Controller)('financial'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [financial_service_1.FinancialService])
], FinancialController);
//# sourceMappingURL=financial.controller.js.map