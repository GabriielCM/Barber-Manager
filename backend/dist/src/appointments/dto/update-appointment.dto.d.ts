import { CreateAppointmentDto } from './create-appointment.dto';
export declare enum AppointmentStatus {
    SCHEDULED = "SCHEDULED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    NO_SHOW = "NO_SHOW"
}
declare const UpdateAppointmentDto_base: import("@nestjs/common").Type<Partial<CreateAppointmentDto>>;
export declare class UpdateAppointmentDto extends UpdateAppointmentDto_base {
    status?: AppointmentStatus;
}
export {};
