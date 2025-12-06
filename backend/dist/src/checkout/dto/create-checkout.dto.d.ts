export declare enum PaymentMethod {
    CASH = "CASH",
    CREDIT_CARD = "CREDIT_CARD",
    DEBIT_CARD = "DEBIT_CARD",
    PIX = "PIX",
    TRANSFER = "TRANSFER"
}
export declare class CheckoutServiceItem {
    serviceId: string;
    price: number;
    isMain?: boolean;
}
export declare class CheckoutProductItem {
    productId: string;
    quantity: number;
    unitPrice: number;
}
export declare class CreateCheckoutDto {
    appointmentId: string;
    services: CheckoutServiceItem[];
    products?: CheckoutProductItem[];
    discount?: number;
    discountPercent?: number;
    paymentMethod: PaymentMethod;
    notes?: string;
}
