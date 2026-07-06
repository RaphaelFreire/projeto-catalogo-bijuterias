import { Injectable } from '@nestjs/common';
import {
  CriticalStockItem,
  DashboardRepository,
  OrderSummary,
  OrdersByPeriodPoint,
  PeriodGranularity,
  StockSummary,
} from '@sdd/dashboard';
import { PrismaService } from '../../db/prisma.service';
import { PrismaProductRepository } from '../catalog/product/product.prisma';

type OrdersByPeriodRow = {
  period_start: Date;
  order_count: number;
  revenue: number;
};

@Injectable()
export class PrismaDashboardRepository implements DashboardRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productRepository: PrismaProductRepository,
  ) {}

  async getStockSummary(): Promise<StockSummary> {
    const result = await this.prisma.stock.aggregate({
      _sum: { quantity: true },
    });

    return { totalQuantity: result._sum.quantity ?? 0 };
  }

  async getOrderSummary(): Promise<OrderSummary> {
    const [totalOrders, result] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { total: true } }),
    ]);

    return {
      totalOrders,
      totalRevenue: result._sum.total?.toNumber() ?? 0,
    };
  }

  async getCriticalStock(limit: number): Promise<CriticalStockItem[]> {
    const rows = await this.prisma.stock.findMany({
      where: { quantity: 1 },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    return Promise.all(
      rows.map(async (row) => {
        const product = await this.productRepository.findById(row.productId);
        return {
          productId: row.productId,
          productName: product?.name ?? null,
          quantity: row.quantity,
        };
      }),
    );
  }

  async getOrdersByPeriod(
    granularity: PeriodGranularity,
    from: Date,
    to: Date,
  ): Promise<OrdersByPeriodPoint[]> {
    const rows = await this.prisma.$queryRaw<OrdersByPeriodRow[]>`
      SELECT
        date_trunc(${granularity}, "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo' AS period_start,
        COUNT(*)::int AS order_count,
        COALESCE(SUM("total"), 0)::float AS revenue
      FROM "orders"
      WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
      GROUP BY period_start
      ORDER BY period_start ASC
    `;

    return rows.map((row) => ({
      periodStart: row.period_start,
      orderCount: row.order_count,
      revenue: row.revenue,
    }));
  }
}
