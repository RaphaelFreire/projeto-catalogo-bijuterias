import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PageResult } from '@sdd/shared';
import { Order, OrderItem, OrderPageParams, OrderRepository } from '@sdd/catalog';
import { PrismaService } from '../../../db/prisma.service';

type OrderRow = {
  id: string;
  code: string;
  customerName: string;
  items: Prisma.JsonValue;
  total: Prisma.Decimal;
  paymentConfirmed: boolean;
  createdAt: Date;
};

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: Order): Promise<Order> {
    const row = await this.prisma.order.create({
      data: this.toRow(entity),
    });
    return this.toEntity(row);
  }

  async update(entity: Order): Promise<Order> {
    const row = await this.prisma.order.update({
      where: { id: entity.id },
      data: {
        code: entity.code,
        customerName: entity.customerName,
        items: entity.items as unknown as Prisma.InputJsonValue,
        total: new Prisma.Decimal(entity.total),
        paymentConfirmed: entity.paymentConfirmed,
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.order.delete({ where: { id } });
  }

  async findById(id: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByCode(code: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({ where: { code } });
    return row ? this.toEntity(row) : null;
  }

  async findPage(params: OrderPageParams): Promise<PageResult<Order>> {
    const skip = (params.page - 1) * params.perPage;
    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: params.perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count(),
    ]);

    return {
      items: rows.map((row) => this.toEntity(row)),
      total,
      page: params.page,
      perPage: params.perPage,
    };
  }

  private toRow(entity: Order) {
    return {
      id: entity.id,
      code: entity.code,
      customerName: entity.customerName,
      items: entity.items as unknown as Prisma.InputJsonValue,
      total: new Prisma.Decimal(entity.total),
      paymentConfirmed: entity.paymentConfirmed,
      createdAt: entity.createdAt,
    };
  }

  private toEntity(row: OrderRow): Order {
    return new Order({
      id: row.id,
      code: row.code,
      customerName: row.customerName,
      items: row.items as unknown as OrderItem[],
      total: row.total.toNumber(),
      paymentConfirmed: row.paymentConfirmed,
      createdAt: row.createdAt,
    });
  }
}
