import { FinancialService } from './financial.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
export declare class FinancialController {
    private readonly financialService;
    constructor(financialService: FinancialService);
    createTransaction(dto: CreateTransactionDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        category: import(".prisma/client").$Enums.TransactionCategory;
        type: import(".prisma/client").$Enums.TransactionType;
        date: Date;
        checkoutId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAllTransactions(skip?: number, take?: number, startDate?: string, endDate?: string, type?: string, category?: string): Promise<{
        transactions: ({
            checkout: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                barberId: string;
                status: import(".prisma/client").$Enums.CheckoutStatus;
                total: import("@prisma/client/runtime/library").Decimal;
                appointmentId: string;
                clientId: string;
                subtotal: import("@prisma/client/runtime/library").Decimal;
                discount: import("@prisma/client/runtime/library").Decimal;
                discountPercent: import("@prisma/client/runtime/library").Decimal;
                paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
                notes: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            category: import(".prisma/client").$Enums.TransactionCategory;
            type: import(".prisma/client").$Enums.TransactionType;
            date: Date;
            checkoutId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
        })[];
        total: number;
    }>;
    deleteTransaction(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        category: import(".prisma/client").$Enums.TransactionCategory;
        type: import(".prisma/client").$Enums.TransactionType;
        date: Date;
        checkoutId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
    getDashboardStats(): Promise<{
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
    }>;
    getDailyCashFlow(date: string): Promise<{
        date: string;
        income: number;
        expense: number;
        balance: number;
        serviceCount: number;
        productCount: number;
        clientCount: number;
        checkoutCount: number;
        transactions: ({
            checkout: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                barberId: string;
                status: import(".prisma/client").$Enums.CheckoutStatus;
                total: import("@prisma/client/runtime/library").Decimal;
                appointmentId: string;
                clientId: string;
                subtotal: import("@prisma/client/runtime/library").Decimal;
                discount: import("@prisma/client/runtime/library").Decimal;
                discountPercent: import("@prisma/client/runtime/library").Decimal;
                paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
                notes: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            category: import(".prisma/client").$Enums.TransactionCategory;
            type: import(".prisma/client").$Enums.TransactionType;
            date: Date;
            checkoutId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
        })[];
    }>;
    getWeeklyCashFlow(startDate: string): Promise<{
        startDate: string;
        endDate: string;
        days: {
            date: string;
            income: number;
            expense: number;
            balance: number;
            serviceCount: number;
            productCount: number;
            clientCount: number;
            checkoutCount: number;
            transactions: ({
                checkout: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    barberId: string;
                    status: import(".prisma/client").$Enums.CheckoutStatus;
                    total: import("@prisma/client/runtime/library").Decimal;
                    appointmentId: string;
                    clientId: string;
                    subtotal: import("@prisma/client/runtime/library").Decimal;
                    discount: import("@prisma/client/runtime/library").Decimal;
                    discountPercent: import("@prisma/client/runtime/library").Decimal;
                    paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
                    notes: string | null;
                } | null;
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: string;
                category: import(".prisma/client").$Enums.TransactionCategory;
                type: import(".prisma/client").$Enums.TransactionType;
                date: Date;
                checkoutId: string | null;
                amount: import("@prisma/client/runtime/library").Decimal;
            })[];
        }[];
        totals: {
            income: number;
            expense: number;
            balance: number;
            serviceCount: number;
            productCount: number;
            clientCount: number;
            checkoutCount: number;
        };
    }>;
    getMonthlyCashFlow(year: number, month: number): Promise<{
        year: number;
        month: number;
        income: number;
        expense: number;
        balance: number;
        byCategory: Record<string, {
            income: number;
            expense: number;
        }>;
        byDay: Record<string, {
            income: number;
            expense: number;
        }>;
    }>;
    getReportByBarber(startDate: string, endDate: string): Promise<any[]>;
    getReportByClient(startDate: string, endDate: string): Promise<any[]>;
    getReportByService(startDate: string, endDate: string): Promise<any[]>;
}
