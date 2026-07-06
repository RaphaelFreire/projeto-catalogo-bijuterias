import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { SettingsController } from './store-settings/settings.controller';
import { PrismaStoreSettingsRepository } from './store-settings/settings.prisma';
import { BannerController } from './banner/banner.controller';
import { PrismaBannerRepository } from './banner/banner.prisma';

@Module({
  imports: [DbModule],
  controllers: [SettingsController, BannerController],
  providers: [PrismaStoreSettingsRepository, PrismaBannerRepository],
  exports: [PrismaStoreSettingsRepository, PrismaBannerRepository],
})
export class SettingsModule {}
