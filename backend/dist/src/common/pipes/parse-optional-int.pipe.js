"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseOptionalIntPipe = void 0;
const common_1 = require("@nestjs/common");
let ParseOptionalIntPipe = class ParseOptionalIntPipe {
    transform(value, metadata) {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        const val = parseInt(value, 10);
        if (isNaN(val)) {
            return undefined;
        }
        return val;
    }
};
exports.ParseOptionalIntPipe = ParseOptionalIntPipe;
exports.ParseOptionalIntPipe = ParseOptionalIntPipe = __decorate([
    (0, common_1.Injectable)()
], ParseOptionalIntPipe);
//# sourceMappingURL=parse-optional-int.pipe.js.map