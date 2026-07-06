import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { CatalogModule } from '../catalog/catalog.module';
import { DashboardController } from './dashboard.controller';
import { PrismaDashboardRepository } from './dashboard.prisma';

@Module({
  imports: [DbModule, CatalogModule],
  controllers: [DashboardController],
  providers: [PrismaDashboardRepository],
})
export class DashboardModule {}
