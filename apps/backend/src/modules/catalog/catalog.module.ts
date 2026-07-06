import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { StorageModule } from '../../storage/storage.module';
import { SettingsModule } from '../settings/settings.module';
import { ProductController } from './product/product.controller';
import { PrismaProductRepository } from './product/product.prisma';
import { CategoryController } from './category/category.controller';
import { PrismaCategoryRepository } from './category/category.prisma';
import { StockController } from './stock/stock.controller';
import { PrismaStockRepository } from './stock/stock.prisma';
import { StorefrontController } from './storefront/storefront.controller';
import { OrderController } from './order/order.controller';
import { PrismaOrderRepository } from './order/order.prisma';

@Module({
  imports: [DbModule, StorageModule, SettingsModule],
  controllers: [
    ProductController,
    CategoryController,
    StockController,
    StorefrontController,
    OrderController,
  ],
  providers: [
    PrismaProductRepository,
    PrismaCategoryRepository,
    PrismaStockRepository,
    PrismaOrderRepository,
  ],
  exports: [
    PrismaProductRepository,
    PrismaCategoryRepository,
    PrismaStockRepository,
    PrismaOrderRepository,
  ],
})
export class CatalogModule {}
