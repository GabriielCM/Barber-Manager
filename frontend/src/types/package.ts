export type SubscriptionPlanType = 'WEEKLY' | 'BIWEEKLY';

export interface PackageService {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface Package {
  id: string;
  name: string;
  description?: string;
  planType: SubscriptionPlanType;
  basePrice: number;
  discountAmount: number;
  finalPrice: number;
  isActive: boolean;
  services: PackageService[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackageRequest {
  name: string;
  description?: string;
  planType: SubscriptionPlanType;
  serviceIds: string[];
  discountAmount?: number;
}

export interface UpdatePackageRequest extends Partial<CreatePackageRequest> {
  isActive?: boolean;
}
