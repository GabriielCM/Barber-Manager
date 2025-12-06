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
exports.CreateCheckoutDto = exports.CheckoutProductItem = exports.CheckoutServiceItem = exports.PaymentMethod = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["CREDIT_CARD"] = "CREDIT_CARD";
    PaymentMethod["DEBIT_CARD"] = "DEBIT_CARD";
    PaymentMethod["PIX"] = "PIX";
    PaymentMethod["TRANSFER"] = "TRANSFER";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
class CheckoutServiceItem {
}
exports.CheckoutServiceItem = CheckoutServiceItem;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-do-servico' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CheckoutServiceItem.prototype, "serviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 45.0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CheckoutServiceItem.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CheckoutServiceItem.prototype, "isMain", void 0);
class CheckoutProductItem {
}
exports.CheckoutProductItem = CheckoutProductItem;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-do-produto' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CheckoutProductItem.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CheckoutProductItem.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 45.0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CheckoutProductItem.prototype, "unitPrice", void 0);
class CreateCheckoutDto {
}
exports.CreateCheckoutDto = CreateCheckoutDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-do-agendamento' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "appointmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CheckoutServiceItem] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CheckoutServiceItem),
    __metadata("design:type", Array)
], CreateCheckoutDto.prototype, "services", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [CheckoutProductItem] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CheckoutProductItem),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateCheckoutDto.prototype, "products", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 10.0, description: 'Valor do desconto' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateCheckoutDto.prototype, "discount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 10, description: 'Percentual de desconto' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateCheckoutDto.prototype, "discountPercent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: PaymentMethod }),
    (0, class_validator_1.IsEnum)(PaymentMethod),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Cliente pagou em 2x no cartão' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "notes", void 0);
//# sourceMappingURL=create-checkout.dto.js.map