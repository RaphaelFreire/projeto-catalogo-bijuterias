import { Controller, Get, Query } from '@nestjs/common';
import { DomainError } from '@sdd/shared';
import type { PeriodGranularity } from '@sdd/dashboard';
import { PrismaDashboardRepository } from './dashboard.prisma';

interface StockSummaryResponse {
  totalQuantity: number;
}

interface OrderSummaryResponse {
  totalOrders: number;
  totalRevenue: number;
}

interface DashboardSummaryResponse {
  stock: StockSummaryResponse;
  orders: OrderSummaryResponse;
}

interface CriticalStockItemResponse {
  productId: string;
  productName: string | null;
  quantity: number;
}

interface OrdersByPeriodPointResponse {
  periodStart: string;
  orderCount: number;
  revenue: number;
}

const GRANULARITIES: PeriodGranularity[] = ['day', 'week', 'month'];
const DEFAULT_CRITICAL_STOCK_LIMIT = 5;
const DEFAULT_RANGE_DAYS: Record<PeriodGranularity, number> = {
  day: 30,
  week: 12 * 7,
  month: 12 * 30,
};

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardRepository: PrismaDashboardRepository) {}

  @Get('summary')
  async findSummary(): Promise<DashboardSummaryResponse> {
    const [stock, orders] = await Promise.all([
      this.dashboardRepository.getStockSummary(),
      this.dashboardRepository.getOrderSummary(),
    ]);

    return { stock, orders };
  }

  @Get('critical-stock')
  async findCriticalStock(
    @Query('limit') limit?: string,
  ): Promise<CriticalStockItemResponse[]> {
    const parsedLimit = parsePositiveInt(limit) ?? DEFAULT_CRITICAL_STOCK_LIMIT;
    return this.dashboardRepository.getCriticalStock(parsedLimit);
  }

  @Get('orders-by-period')
  async findOrdersByPeriod(
    @Query('granularity') granularity?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<OrdersByPeriodPointResponse[]> {
    if (!granularity || !GRANULARITIES.includes(granularity as PeriodGranularity)) {
      throw new DomainError('dashboard.granularity.invalid', 422);
    }

    const resolvedGranularity = granularity as PeriodGranularity;
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from
      ? new Date(from)
      : new Date(toDate.getTime() - DEFAULT_RANGE_DAYS[resolvedGranularity] * 24 * 60 * 60 * 1000);

    const points = await this.dashboardRepository.getOrdersByPeriod(
      resolvedGranularity,
      fromDate,
      toDate,
    );

    return points.map((point) => ({
      periodStart: point.periodStart.toISOString(),
      orderCount: point.orderCount,
      revenue: point.revenue,
    }));
  }
}

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
}
