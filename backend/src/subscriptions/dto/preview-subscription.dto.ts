import { CreateSubscriptionDto } from './create-subscription.dto';

export class PreviewSubscriptionDto extends CreateSubscriptionDto {}

export interface AppointmentPreview {
  slotIndex: number;
  date: Date;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  duration: number;
  hasConflict: boolean;
  conflictDetails?: {
    existingAppointmentId: string;
    existingClientName: string;
    existingStartTime: Date;
    existingEndTime: Date;
  };
}

export interface SubscriptionPreviewResponse {
  subscription: {
    planType: string;
    startDate: Date;
    endDate: Date;
    durationMonths: number;
    totalSlots: number;
    intervalDays: number;
  };
  appointments: AppointmentPreview[];
  hasAnyConflict: boolean;
  conflictCount: number;
}
