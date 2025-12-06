export declare enum StockMovementType {
    ENTRY = "ENTRY",
    EXIT = "EXIT",
    ADJUSTMENT = "ADJUSTMENT"
}
export declare class StockMovementDto {
    type: StockMovementType;
    quantity: number;
    reason?: string;
}
