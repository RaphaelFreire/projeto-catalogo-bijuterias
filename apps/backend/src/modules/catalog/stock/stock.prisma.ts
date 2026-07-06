import { Injectable } from '@nestjs/common';
import { PageResult } from '@sdd/shared';
import { Stock, StockPageParams, StockRepository } from '@sdd/catalog';
import { PrismaService } from '../../../db/prisma.service';

type StockRow = {
  id: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

@Injectable()
export class PrismaStockRepository implements StockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: Stock): Promise<Stock> {
    const row = await this.prisma.stock.create({
      data: this.toRow(entity),
    });
    return this.toEntity(row);
  }

  async update(entity: Stock): Promise<Stock> {
    const row = await this.prisma.stock.update({
      where: { id: entity.id },
      data: {
        quantity: entity.quantity,
        updatedAt: entity.updatedAt,
        deletedAt: entity.deletedAt ?? null,
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.stock.delete({ where: { id } });
  }

  async findById(id: string): Promise<Stock | null> {
    const row = await this.prisma.stock.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByProductId(productId: string): Promise<Stock | null> {
    const row = await this.prisma.stock.findUnique({ where: { productId } });
    return row ? this.toEntity(row) : null;
  }

  async decrementIfAvailable(productId: string, quantity: number): Promise<boolean> {
    const result = await this.prisma.stock.updateMany({
      where: { productId, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    });
    return result.count > 0;
  }

  async findPage(params: StockPageParams): Promise<PageResult<Stock>> {
    const skip = (params.page - 1) * params.perPage;
    const [rows, total] = await Promise.all([
      this.prisma.stock.findMany({
        skip,
        take: params.perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stock.count(),
    ]);

    return {
      items: rows.map((row) => this.toEntity(row)),
      total,
      page: params.page,
      perPage: params.perPage,
    };
  }

  private toRow(entity: Stock) {
    return {
      id: entity.id,
      productId: entity.productId,
      quantity: entity.quantity,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }

  private toEntity(row: StockRow): Stock {
    return new Stock({
      id: row.id,
      productId: row.productId,
      quantity: row.quantity,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }
}
