export declare enum ClientStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    BANNED = "BANNED",
    DEFAULTER = "DEFAULTER"
}
export declare class CreateClientDto {
    name: string;
    phone: string;
    email?: string;
    birthDate?: string;
    observations?: string;
    status?: ClientStatus;
}
