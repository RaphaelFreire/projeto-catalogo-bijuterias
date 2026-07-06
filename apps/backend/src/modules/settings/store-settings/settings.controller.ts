import { randomUUID } from 'crypto';
import { extname } from 'path';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SaveStoreSettings, STORE_SETTINGS_ID } from '@sdd/settings';
import type { SaveStoreSettingsIn } from '@sdd/settings';
import { Public } from '../../../shared/decorators/public.decorator';
import { R2StorageService } from '../../../storage/r2-storage.service';
import { PrismaStoreSettingsRepository } from './settings.prisma';

interface SettingsResponse {
  whatsappNumber: string | null;
  logoUrl: string | null;
}

@Controller('settings')
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(
    private readonly storeSettingsRepository: PrismaStoreSettingsRepository,
    private readonly storageService: R2StorageService,
  ) {}

  @Public()
  @Get()
  async findSettings(): Promise<SettingsResponse> {
    const settings = await this.storeSettingsRepository.findById(STORE_SETTINGS_ID);
    return {
      whatsappNumber: settings?.whatsappNumber ?? null,
      logoUrl: settings?.logoUrl ?? null,
    };
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateSettings(@Body() body: SaveStoreSettingsIn): Promise<void> {
    const useCase = new SaveStoreSettings(this.storeSettingsRepository);
    await useCase.execute(body);
  }

  @Post('logo')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ logoUrl: string }> {
    const existing = await this.storeSettingsRepository.findById(STORE_SETTINGS_ID);

    const filename = `${randomUUID()}${extname(file.originalname)}`;
    const logoUrl = await this.storageService.upload(
      `settings/${filename}`,
      file.buffer,
      file.mimetype,
    );

    const useCase = new SaveStoreSettings(this.storeSettingsRepository);
    await useCase.execute({ logoUrl });

    if (existing?.logoUrl) {
      await this.removeLogoFile(existing.logoUrl);
    }

    return { logoUrl };
  }

  @Delete('logo')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeLogo(): Promise<void> {
    const existing = await this.storeSettingsRepository.findById(STORE_SETTINGS_ID);
    if (!existing || !existing.logoUrl) {
      return;
    }

    const useCase = new SaveStoreSettings(this.storeSettingsRepository);
    await useCase.execute({ logoUrl: null });

    await this.removeLogoFile(existing.logoUrl);
  }

  private async removeLogoFile(logoUrl: string): Promise<void> {
    try {
      const key = this.storageService.keyFromUrl(logoUrl);
      if (key) {
        await this.storageService.delete(key);
      }
    } catch (error) {
      this.logger.warn(`Falha ao remover arquivo de logo ${logoUrl}: ${error}`);
    }
  }
}
