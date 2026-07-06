import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';
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
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { SaveStoreSettings, STORE_SETTINGS_ID } from '@sdd/settings';
import type { SaveStoreSettingsIn } from '@sdd/settings';
import { Public } from '../../../shared/decorators/public.decorator';
import { PrismaStoreSettingsRepository } from './settings.prisma';

interface SettingsResponse {
  whatsappNumber: string | null;
  logoUrl: string | null;
}

const UPLOADS_ROOT = join(process.cwd(), 'uploads');

@Controller('settings')
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(private readonly storeSettingsRepository: PrismaStoreSettingsRepository) {}

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
    @Req() request: Request,
  ): Promise<{ logoUrl: string }> {
    const existing = await this.storeSettingsRepository.findById(STORE_SETTINGS_ID);

    const filename = `${randomUUID()}${extname(file.originalname)}`;
    const logoUrl = `${request.protocol}://${request.get('host')}/uploads/settings/${filename}`;

    const dir = join(UPLOADS_ROOT, 'settings');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), file.buffer);

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
      const pathname = new URL(logoUrl).pathname;
      const filePath = join(process.cwd(), pathname.replace(/^\//, ''));
      await unlink(filePath);
    } catch (error) {
      this.logger.warn(`Falha ao remover arquivo de logo ${logoUrl}: ${error}`);
    }
  }
}
