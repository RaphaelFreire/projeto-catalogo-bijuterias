import { Injectable } from '@nestjs/common';
import { PageResult, NotFoundError } from '@sdd/shared';
import { User, UserPageParams, UserRepository } from '@sdd/auth';
import { PrismaService } from '../../../db/prisma.service';

type UserRow = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: User): Promise<User> {
    const row = await this.prisma.user.create({
      data: this.toRow(entity),
    });
    return this.toEntity(row);
  }

  async update(entity: User): Promise<User> {
    const row = await this.prisma.user.update({
      where: { id: entity.id },
      data: {
        name: entity.name,
        email: entity.email,
        password: entity.password,
        updatedAt: entity.updatedAt,
        deletedAt: entity.deletedAt ?? null,
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('user.not-found');
    }
    await this.prisma.user.delete({ where: { id } });
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toEntity(row) : null;
  }

  async findPage(params: UserPageParams): Promise<PageResult<User>> {
    const skip = (params.page - 1) * params.perPage;
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: params.perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      items: rows.map((row) => this.toEntity(row)),
      total,
      page: params.page,
      perPage: params.perPage,
    };
  }

  private toRow(entity: User) {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      password: entity.password,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }

  private toEntity(row: UserRow): User {
    return new User({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }
}
