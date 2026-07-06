import { Injectable } from '@nestjs/common';
import { PageResult } from '@sdd/shared';
import { Category, CategoryPageParams, CategoryRepository } from '@sdd/catalog';
import { PrismaService } from '../../../db/prisma.service';

type CategoryRow = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: Category): Promise<Category> {
    const row = await this.prisma.category.create({
      data: this.toRow(entity),
    });
    return this.toEntity(row);
  }

  async update(entity: Category): Promise<Category> {
    const row = await this.prisma.category.update({
      where: { id: entity.id },
      data: {
        name: entity.name,
        updatedAt: entity.updatedAt,
        deletedAt: entity.deletedAt ?? null,
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }

  async findById(id: string): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findPage(params: CategoryPageParams): Promise<PageResult<Category>> {
    const skip = (params.page - 1) * params.perPage;
    const [rows, total] = await Promise.all([
      this.prisma.category.findMany({
        skip,
        take: params.perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.category.count(),
    ]);

    return {
      items: rows.map((row) => this.toEntity(row)),
      total,
      page: params.page,
      perPage: params.perPage,
    };
  }

  private toRow(entity: Category) {
    return {
      id: entity.id,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }

  private toEntity(row: CategoryRow): Category {
    return new Category({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }
}
