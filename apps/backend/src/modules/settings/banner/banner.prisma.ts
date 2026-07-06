import { Injectable } from '@nestjs/common';
import { PageResult } from '@sdd/shared';
import { Banner, BannerPageParams, BannerRepository } from '@sdd/catalog';
import { PrismaService } from '../../../db/prisma.service';

type BannerRow = {
  id: string;
  imageUrl: string;
  imageUrlMobile: string | null;
  position: number;
  categoryId: string | null;
  linkUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

@Injectable()
export class PrismaBannerRepository implements BannerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: Banner): Promise<Banner> {
    const row = await this.prisma.banner.create({
      data: this.toRow(entity),
    });
    return this.toEntity(row);
  }

  async update(entity: Banner): Promise<Banner> {
    const row = await this.prisma.banner.update({
      where: { id: entity.id },
      data: {
        imageUrl: entity.imageUrl,
        imageUrlMobile: entity.imageUrlMobile,
        position: entity.position,
        categoryId: entity.categoryId,
        linkUrl: entity.linkUrl,
        updatedAt: entity.updatedAt,
        deletedAt: entity.deletedAt ?? null,
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.banner.delete({ where: { id } });
  }

  async findById(id: string): Promise<Banner | null> {
    const row = await this.prisma.banner.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findPage(params: BannerPageParams): Promise<PageResult<Banner>> {
    const skip = (params.page - 1) * params.perPage;
    const [rows, total] = await Promise.all([
      this.prisma.banner.findMany({
        skip,
        take: params.perPage,
        orderBy: { position: 'asc' },
      }),
      this.prisma.banner.count(),
    ]);

    return {
      items: rows.map((row) => this.toEntity(row)),
      total,
      page: params.page,
      perPage: params.perPage,
    };
  }

  private toRow(entity: Banner) {
    return {
      id: entity.id,
      imageUrl: entity.imageUrl,
      imageUrlMobile: entity.imageUrlMobile,
      position: entity.position,
      categoryId: entity.categoryId,
      linkUrl: entity.linkUrl,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }

  private toEntity(row: BannerRow): Banner {
    return new Banner({
      id: row.id,
      imageUrl: row.imageUrl,
      imageUrlMobile: row.imageUrlMobile,
      position: row.position,
      categoryId: row.categoryId,
      linkUrl: row.linkUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }
}
