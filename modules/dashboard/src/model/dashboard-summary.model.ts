export type PeriodGranularity = "day" | "week" | "month";

export interface StockSummary {
  totalQuantity: number;
}

export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
}

export interface CriticalStockItem {
  productId: string;
  productName: string | null;
  quantity: number;
}

export interface OrdersByPeriodPoint {
  periodStart: Date;
  orderCount: number;
  revenue: number;
}
