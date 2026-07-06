import { randomUUID } from 'crypto';
import { extname } from 'path';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  Banner,
  BannerNotFoundError,
  DeleteBanner,
  SaveBanner,
} from '@sdd/catalog';
import type { SaveBannerIn } from '@sdd/catalog';
import { R2StorageService } from '../../../storage/r2-storage.service';
import { PrismaBannerRepository } from './banner.prisma';

interface BannerResponse {
  id: string;
  imageUrl: string;
  imageUrlMobile: string | null;
  position: number;
  categoryId: string | null;
  linkUrl: string | null;
}

interface BannerPageResponse {
  items: BannerResponse[];
  total: number;
  page: number;
  perPage: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

@Controller('banners')
export class BannerController {
  constructor(
    private readonly bannerRepository: PrismaBannerRepository,
    private readonly storageService: R2StorageService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: SaveBannerIn): Promise<{ id: string }> {
    const id = body.id ?? randomUUID();
    const useCase = new SaveBanner(this.bannerRepository);
    await useCase.execute({ ...body, id });
    return { id };
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() body: Omit<SaveBannerIn, 'id'>,
  ): Promise<void> {
    const useCase = new SaveBanner(this.bannerRepository);
    await useCase.execute({ ...body, id });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    const useCase = new DeleteBanner(this.bannerRepository);
    await useCase.execute({ id });
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<BannerResponse> {
    const banner = await this.bannerRepository.findById(id);
    if (!banner) {
      throw new BannerNotFoundError();
    }
    return this.toResponse(banner);
  }

  @Get()
  async findPage(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ): Promise<BannerPageResponse> {
    const pageNumber = parsePositiveInt(page) ?? DEFAULT_PAGE;
    const perPageNumber = parsePositiveInt(perPage) ?? DEFAULT_PER_PAGE;
    const result = await this.bannerRepository.findPage({
      page: pageNumber,
      perPage: perPageNumber,
    });
    return {
      items: result.items.map((banner) => this.toResponse(banner)),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
    };
  }

  @Post('upload-image')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ imageUrl: string }> {
    const filename = `${randomUUID()}${extname(file.originalname)}`;
    const imageUrl = await this.storageService.upload(
      `banners/${filename}`,
      file.buffer,
      file.mimetype,
    );

    return { imageUrl };
  }

  private toResponse(banner: Banner): BannerResponse {
    return {
      id: banner.id,
      imageUrl: banner.imageUrl,
      imageUrlMobile: banner.imageUrlMobile,
      position: banner.position,
      categoryId: banner.categoryId,
      linkUrl: banner.linkUrl,
    };
  }
}

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
}
