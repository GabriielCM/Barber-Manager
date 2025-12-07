export enum SubscriptionPlanType {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface Subscription {
  id: string;
  clientId: string;
  barberId: string;
  packageId: string;
  planType: SubscriptionPlanType;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  durationMonths: number;
  totalSlots: number;
  completedSlots?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  pausedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  client?: {
    id: string;
    name: string;
    phone: string;
  };
  barber?: {
    id: string;
    name: string;
  };
  package?: {
    id: string;
    name: string;
    description?: string;
    planType: SubscriptionPlanType;
    basePrice: number;
    discountAmount: number;
    finalPrice: number;
    services: Array<{
      id: string;
      name: string;
      duration: number;
      price: number;
    }>;
  };
  appointments?: any[];
  changeLogs?: SubscriptionChangeLog[];
  _count?: {
    appointments: number;
  };
}

export interface AppointmentPreview {
  slotIndex: number;
  date: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  duration: number;
  hasConflict: boolean;
  conflictDetails?: {
    existingAppointmentId: string;
    existingClientName: string;
    existingStartTime: string;
    existingEndTime: string;
  };
}

export interface SubscriptionPreview {
  subscription: {
    planType: SubscriptionPlanType;
    startDate: string;
    endDate: string;
    durationMonths: number;
    totalSlots: number;
    intervalDays: number;
  };
  appointments: AppointmentPreview[];
  hasAnyConflict: boolean;
  conflictCount: number;
}

export interface SubscriptionChangeLog {
  id: string;
  changeType: string;
  description: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  createdAt: string;
}

export interface CreateSubscriptionDto {
  clientId: string;
  barberId: string;
  packageId: string;
  startDate: string;
  durationMonths: number;
  notes?: string;
}

export interface AppointmentAdjustment {
  slotIndex: number;
  newDate: string;
  reason?: string;
}
