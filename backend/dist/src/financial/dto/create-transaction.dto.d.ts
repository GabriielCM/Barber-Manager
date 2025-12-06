export declare enum TransactionType {
    INCOME = "INCOME",
    EXPENSE = "EXPENSE"
}
export declare enum TransactionCategory {
    SERVICE = "SERVICE",
    PRODUCT = "PRODUCT",
    PACKAGE = "PACKAGE",
    SUPPLIES = "SUPPLIES",
    RENT = "RENT",
    UTILITIES = "UTILITIES",
    SALARY = "SALARY",
    MAINTENANCE = "MAINTENANCE",
    MARKETING = "MARKETING",
    OTHER = "OTHER"
}
export declare class CreateTransactionDto {
    type: TransactionType;
    category: TransactionCategory;
    description: string;
    amount: number;
    date?: string;
}
