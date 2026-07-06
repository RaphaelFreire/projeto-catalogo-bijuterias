import { Injectable } from '@nestjs/common';
import { PageResult } from '@sdd/shared';
import {
  StoreSettings,
  StoreSettingsPageParams,
  StoreSettingsRepository,
} from '@sdd/settings';
import { PrismaService } from '../../../db/prisma.service';

type StoreSettingsRow = {
  id: string;
  whatsappNumber: string | null;
  logoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

@Injectable()
export class PrismaStoreSettingsRepository implements StoreSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: StoreSettings): Promise<StoreSettings> {
    const row = await this.prisma.storeSettings.create({
      data: this.toRow(entity),
    });
    return this.toEntity(row);
  }

  async update(entity: StoreSettings): Promise<StoreSettings> {
    const row = await this.prisma.storeSettings.update({
      where: { id: entity.id },
      data: {
        whatsappNumber: entity.whatsappNumber,
        logoUrl: entity.logoUrl,
        updatedAt: entity.updatedAt,
        deletedAt: entity.deletedAt ?? null,
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.storeSettings.delete({ where: { id } });
  }

  async findById(id: string): Promise<StoreSettings | null> {
    const row = await this.prisma.storeSettings.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findPage(params: StoreSettingsPageParams): Promise<PageResult<StoreSettings>> {
    const skip = (params.page - 1) * params.perPage;
    const [rows, total] = await Promise.all([
      this.prisma.storeSettings.findMany({
        skip,
        take: params.perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.storeSettings.count(),
    ]);

    return {
      items: rows.map((row) => this.toEntity(row)),
      total,
      page: params.page,
      perPage: params.perPage,
    };
  }

  private toRow(entity: StoreSettings) {
    return {
      id: entity.id,
      whatsappNumber: entity.whatsappNumber,
      logoUrl: entity.logoUrl,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }

  private toEntity(row: StoreSettingsRow): StoreSettings {
    return new StoreSettings({
      id: row.id,
      whatsappNumber: row.whatsappNumber,
      logoUrl: row.logoUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }
}
