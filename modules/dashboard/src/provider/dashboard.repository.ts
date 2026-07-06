import {
  CriticalStockItem,
  OrderSummary,
  OrdersByPeriodPoint,
  PeriodGranularity,
  StockSummary,
} from "../model";

export interface DashboardRepository {
  getStockSummary(): Promise<StockSummary>;
  getOrderSummary(): Promise<OrderSummary>;
  getCriticalStock(limit: number): Promise<CriticalStockItem[]>;
  getOrdersByPeriod(
    granularity: PeriodGranularity,
    from: Date,
    to: Date,
  ): Promise<OrdersByPeriodPoint[]>;
}
