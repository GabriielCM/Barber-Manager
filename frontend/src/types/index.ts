// Auth
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// Client
export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthDate?: string;
  observations?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DEFAULTER';
  totalSpent: number;
  noShowCount: number;
  createdAt: string;
  updatedAt: string;
}

// Barber
export interface Barber {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  specialties: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Service
export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Product
export interface ProductCategory {
  id: string;
  name: string;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: ProductCategory;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  salePrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Appointment Service (for package appointments)
export interface AppointmentService {
  id: string;
  appointmentId: string;
  serviceId: string;
  service?: Service;
  createdAt: string;
}

// Appointment
export interface Appointment {
  id: string;
  clientId: string;
  client?: Client;
  barberId: string;
  barber?: Barber;
  serviceId?: string;
  service?: Service;
  date: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  checkout?: Checkout;
  // Subscription-related fields
  subscriptionId?: string;
  isSubscriptionBased?: boolean;
  subscriptionSlotIndex?: number;
  subscription?: {
    id: string;
    totalSlots: number;
    completedSlots: number;
    planType: string;
    package?: {
      id: string;
      name: string;
      basePrice: number;
      discountAmount: number;
      finalPrice: number;
      services?: Array<{
        id: string;
        serviceId: string;
        service?: Service;
      }>;
    };
  };
  appointmentServices?: AppointmentService[];
  createdAt: string;
  updatedAt: string;
}

// Checkout
export interface CheckoutService {
  id: string;
  serviceId: string;
  service?: Service;
  price: number;
  isMain: boolean;
}

export interface CheckoutProduct {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Checkout {
  id: string;
  appointmentId: string;
  appointment?: Appointment;
  clientId: string;
  client?: Client;
  barberId: string;
  barber?: Barber;
  subtotal: number;
  discount: number;
  discountPercent: number;
  total: number;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'TRANSFER';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  services: CheckoutService[];
  products: CheckoutProduct[];
  createdAt: string;
  updatedAt: string;
}

// Financial
export interface FinancialTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  amount: number;
  date: string;
  checkoutId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  today: {
    revenue: number;
    checkouts: number;
    appointments: number;
    completedAppointments: number;
  };
  month: {
    revenue: number;
    expenses: number;
    profit: number;
    checkouts: number;
  };
  alerts: {
    lowStockCount: number;
  };
  totals: {
    activeClients: number;
  };
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
