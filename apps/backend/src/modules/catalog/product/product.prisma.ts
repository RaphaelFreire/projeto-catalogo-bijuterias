import { Injectable } from '@nestjs/common';
import { PageResult } from '@sdd/shared';
import {
  Product,
  ProductPageParams,
  ProductRepository,
  ProductStatus,
} from '@sdd/catalog';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../db/prisma.service';

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: Prisma.Decimal;
  status: string;
  bestSeller: boolean;
  dailyDeal: boolean;
  lastUnits: boolean;
  categoryId: string | null;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: Product): Promise<Product> {
    const row = await this.prisma.product.create({
      data: this.toRow(entity),
    });
    return this.toEntity(row);
  }

  async update(entity: Product): Promise<Product> {
    const row = await this.prisma.product.update({
      where: { id: entity.id },
      data: {
        name: entity.name,
        description: entity.description,
        price: entity.price,
        status: entity.status,
        bestSeller: entity.bestSeller,
        dailyDeal: entity.dailyDeal,
        lastUnits: entity.lastUnits,
        categoryId: entity.categoryId,
        images: entity.images,
        updatedAt: entity.updatedAt,
        deletedAt: entity.deletedAt ?? null,
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findPage(params: ProductPageParams): Promise<PageResult<Product>> {
    const skip = (params.page - 1) * params.perPage;
    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: params.perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count(),
    ]);

    return {
      items: rows.map((row) => this.toEntity(row)),
      total,
      page: params.page,
      perPage: params.perPage,
    };
  }

  private toRow(entity: Product) {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      price: new Prisma.Decimal(entity.price),
      status: entity.status,
      bestSeller: entity.bestSeller,
      dailyDeal: entity.dailyDeal,
      lastUnits: entity.lastUnits,
      categoryId: entity.categoryId,
      images: entity.images,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }

  private toEntity(row: ProductRow): Product {
    return new Product({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price.toNumber(),
      status: row.status as ProductStatus,
      bestSeller: row.bestSeller,
      dailyDeal: row.dailyDeal,
      lastUnits: row.lastUnits,
      categoryId: row.categoryId,
      images: row.images,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }
}
