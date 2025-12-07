import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout on authentication errors, not authorization errors
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth');
      const hasToken = typeof window !== 'undefined' && localStorage.getItem('token');

      console.log('401 Error:', {
        url: error.config?.url,
        isAuthEndpoint,
        hasToken: !!hasToken,
        message: error.response?.data?.message,
      });

      // Only auto-logout if:
      // 1. It's trying to get the user profile and failing (token invalid)
      // 2. It's an auth endpoint and failing
      // 3. There's no token at all
      const isProfileCheck = error.config?.url?.includes('/auth/me');

      if (isProfileCheck || isAuthEndpoint || !hasToken) {
        console.log('Logging out due to authentication failure');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/auth/login';
        }
      } else {
        console.log('401 error but not logging out - might be authorization issue');
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
};

// Clients
export const clientsApi = {
  getAll: (params?: { skip?: number; take?: number; search?: string; status?: string }) =>
    api.get('/clients', { params }),
  getOne: (id: string) => api.get(`/clients/${id}`),
  getHistory: (id: string) => api.get(`/clients/${id}/history`),
  search: (query: string) => api.get('/clients/search', { params: { q: query } }),
  getVip: (minTicket?: number) => api.get('/clients/vip', { params: { minTicket } }),
  getInactive: (days?: number) => api.get('/clients/inactive', { params: { days } }),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.patch(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

// Barbers
export const barbersApi = {
  getAll: (onlyActive?: boolean) => api.get('/barbers', { params: { onlyActive } }),
  getOne: (id: string) => api.get(`/barbers/${id}`),
  getDashboard: (id: string, startDate?: string, endDate?: string) =>
    api.get(`/barbers/${id}/dashboard`, { params: { startDate, endDate } }),
  getAvailable: (date: string, serviceId?: string) =>
    api.get('/barbers/available', { params: { date, serviceId } }),
  create: (data: any) => api.post('/barbers', data),
  update: (id: string, data: any) => api.patch(`/barbers/${id}`, data),
  assignService: (barberId: string, serviceId: string) =>
    api.post(`/barbers/${barberId}/services/${serviceId}`),
  removeService: (barberId: string, serviceId: string) =>
    api.delete(`/barbers/${barberId}/services/${serviceId}`),
  delete: (id: string) => api.delete(`/barbers/${id}`),
};

// Services
export const servicesApi = {
  getAll: (onlyActive?: boolean) => api.get('/services', { params: { onlyActive } }),
  getOne: (id: string) => api.get(`/services/${id}`),
  getPopular: (limit?: number) => api.get('/services/popular', { params: { limit } }),
  getByBarber: (barberId: string) => api.get(`/services/barber/${barberId}`),
  create: (data: any) => api.post('/services', data),
  update: (id: string, data: any) => api.patch(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

// Products
export const productsApi = {
  getAll: (params?: { skip?: number; take?: number; search?: string; categoryId?: string; lowStock?: boolean }) =>
    api.get('/products', { params }),
  getOne: (id: string) => api.get(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
  getMovements: (id: string) => api.get(`/products/${id}/movements`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.patch(`/products/${id}`, data),
  addStockMovement: (id: string, data: any) => api.post(`/products/${id}/stock`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  // Categories
  getCategories: () => api.get('/products/categories'),
  createCategory: (name: string) => api.post('/products/categories', { name }),
  deleteCategory: (id: string) => api.delete(`/products/categories/${id}`),
};

// Appointments
export const appointmentsApi = {
  getAll: (params?: { skip?: number; take?: number; date?: string; barberId?: string; clientId?: string; status?: string }) =>
    api.get('/appointments', { params }),
  getOne: (id: string) => api.get(`/appointments/${id}`),
  getToday: () => api.get('/appointments/today'),
  getUpcoming: (barberId?: string) => api.get('/appointments/upcoming', { params: { barberId } }),
  getCalendar: (startDate: string, endDate: string, barberId?: string) =>
    api.get('/appointments/calendar', { params: { startDate, endDate, barberId } }),
  create: (data: any) => api.post('/appointments', data),
  update: (id: string, data: any) => api.patch(`/appointments/${id}`, data),
  start: (id: string) => api.post(`/appointments/${id}/start`),
  cancel: (id: string) => api.delete(`/appointments/${id}`),
};

// Checkout
export const checkoutApi = {
  getAll: (params?: { skip?: number; take?: number; startDate?: string; endDate?: string; barberId?: string; clientId?: string }) =>
    api.get('/checkout', { params }),
  getOne: (id: string) => api.get(`/checkout/${id}`),
  getReceipt: (id: string) => api.get(`/checkout/${id}/receipt`),
  create: (data: any) => api.post('/checkout', data),
  cancel: (id: string) => api.delete(`/checkout/${id}`),
};

// Financial
export const financialApi = {
  getTransactions: (params?: { skip?: number; take?: number; startDate?: string; endDate?: string; type?: string; category?: string }) =>
    api.get('/financial/transactions', { params }),
  createTransaction: (data: any) => api.post('/financial/transactions', data),
  deleteTransaction: (id: string) => api.delete(`/financial/transactions/${id}`),
  getDashboard: () => api.get('/financial/dashboard'),
  getDailyCashFlow: (date: string) => api.get('/financial/cash-flow/daily', { params: { date } }),
  getWeeklyCashFlow: (startDate: string) => api.get('/financial/cash-flow/weekly', { params: { startDate } }),
  getMonthlyCashFlow: (year: number, month: number) => api.get('/financial/cash-flow/monthly', { params: { year, month } }),
  getReportByBarber: (startDate: string, endDate: string) =>
    api.get('/financial/reports/barber', { params: { startDate, endDate } }),
  getReportByClient: (startDate: string, endDate: string) =>
    api.get('/financial/reports/client', { params: { startDate, endDate } }),
  getReportByService: (startDate: string, endDate: string) =>
    api.get('/financial/reports/service', { params: { startDate, endDate } }),
};

// WhatsApp
export const whatsappApi = {
  getStatus: () => api.get('/whatsapp/status'),
  getQR: () => api.get('/whatsapp/qr'),
  initialize: () => api.post('/whatsapp/initialize'),
  disconnect: () => api.post('/whatsapp/disconnect'),
  send: (data: { phoneNumber: string; message: string }) => api.post('/whatsapp/send', data),
  getLogs: (params?: { skip?: number; take?: number; level?: string }) =>
    api.get('/whatsapp/logs', { params }),
  clearLogs: () => api.delete('/whatsapp/logs/clear'),
};

// Notifications
export const notificationsApi = {
  getAll: (params?: { skip?: number; take?: number; status?: string; type?: string; startDate?: string; endDate?: string; clientId?: string }) =>
    api.get('/notifications', { params }),
  getOne: (id: string) => api.get(`/notifications/${id}`),
  getClientHistory: (clientId: string, params?: { skip?: number; take?: number }) =>
    api.get(`/notifications/client/${clientId}`, { params }),
  sendManual: (data: { clientId: string; message: string }) =>
    api.post('/notifications/manual', data),
  getStats: () => api.get('/notifications/stats'),
  retry: (id: string) => api.post(`/notifications/${id}/retry`),
  processPending: () => api.post('/notifications/process-pending'),
  processScheduled: () => api.post('/notifications/process-scheduled'),
};
