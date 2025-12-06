export declare enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER"
}
export declare class RegisterDto {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
}
