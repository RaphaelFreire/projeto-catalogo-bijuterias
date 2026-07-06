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
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  DeleteProduct,
  Product,
  ProductNotFoundError,
  ProductStatus,
  SaveProduct,
  SaveStock,
} from '@sdd/catalog';
import type { SaveProductIn } from '@sdd/catalog';
import { R2StorageService } from '../../../storage/r2-storage.service';
import { PrismaProductRepository } from './product.prisma';
import { PrismaStockRepository } from '../stock/stock.prisma';

interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  status: ProductStatus;
  bestSeller: boolean;
  dailyDeal: boolean;
  lastUnits: boolean;
  categoryId: string | null;
  images: string[];
  quantity: number;
}

interface SaveProductRequest extends SaveProductIn {
  quantity?: number;
}

interface ProductPageResponse {
  items: ProductResponse[];
  total: number;
  page: number;
  perPage: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(
    private readonly productRepository: PrismaProductRepository,
    private readonly stockRepository: PrismaStockRepository,
    private readonly storageService: R2StorageService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: SaveProductRequest): Promise<{ id: string }> {
    const id = body.id ?? randomUUID();
    const { quantity, ...productInput } = body;

    const saveProduct = new SaveProduct(this.productRepository);
    await saveProduct.execute({ ...productInput, id });

    const saveStock = new SaveStock(this.stockRepository);
    await saveStock.execute({ productId: id, quantity: quantity ?? 0 });

    return { id };
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() body: Omit<SaveProductRequest, 'id'>,
  ): Promise<void> {
    const { quantity, ...productInput } = body;

    const useCase = new SaveProduct(this.productRepository);
    await useCase.execute({ ...productInput, id });

    if (quantity !== undefined) {
      const existingStock = await this.stockRepository.findByProductId(id);
      const saveStock = new SaveStock(this.stockRepository);
      await saveStock.execute({ id: existingStock?.id, productId: id, quantity });
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    const useCase = new DeleteProduct(this.productRepository);
    await useCase.execute({ id });
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProductResponse> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new ProductNotFoundError();
    }
    const stock = await this.stockRepository.findByProductId(id);
    return this.toResponse(product, stock?.quantity ?? 0);
  }

  @Get()
  async findPage(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ): Promise<ProductPageResponse> {
    const pageNumber = parsePositiveInt(page) ?? DEFAULT_PAGE;
    const perPageNumber = parsePositiveInt(perPage) ?? DEFAULT_PER_PAGE;
    const result = await this.productRepository.findPage({
      page: pageNumber,
      perPage: perPageNumber,
    });
    const items = await Promise.all(
      result.items.map(async (product) => {
        const stock = await this.stockRepository.findByProductId(product.id);
        return this.toResponse(product, stock?.quantity ?? 0);
      }),
    );
    return {
      items,
      total: result.total,
      page: result.page,
      perPage: result.perPage,
    };
  }

  @Post(':id/images')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ images: string[] }> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new ProductNotFoundError();
    }

    const filename = `${randomUUID()}${extname(file.originalname)}`;
    const url = await this.storageService.upload(
      `products/${id}/${filename}`,
      file.buffer,
      file.mimetype,
    );
    const images = [...product.images, url];

    const candidate = product.clone({ images });
    candidate.validate();

    const useCase = new SaveProduct(this.productRepository);
    await useCase.execute(this.toSaveInput(product, { images }));

    return { images };
  }

  @Delete(':id/images')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeImage(
    @Param('id') id: string,
    @Body() body: { url: string },
  ): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new ProductNotFoundError();
    }

    const images = product.images.filter((image) => image !== body.url);

    const useCase = new SaveProduct(this.productRepository);
    await useCase.execute(this.toSaveInput(product, { images }));

    try {
      const key = this.storageService.keyFromUrl(body.url);
      if (key) {
        await this.storageService.delete(key);
      }
    } catch (error) {
      this.logger.warn(`Falha ao remover arquivo de imagem ${body.url}: ${error}`);
    }
  }

  private toSaveInput(
    product: Product,
    overrides: Partial<SaveProductIn>,
  ): SaveProductIn {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      status: product.status,
      bestSeller: product.bestSeller,
      dailyDeal: product.dailyDeal,
      lastUnits: product.lastUnits,
      categoryId: product.categoryId,
      images: product.images,
      ...overrides,
    };
  }

  private toResponse(product: Product, quantity: number): ProductResponse {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      status: product.status,
      bestSeller: product.bestSeller,
      dailyDeal: product.dailyDeal,
      lastUnits: product.lastUnits,
      categoryId: product.categoryId,
      images: product.images,
      quantity,
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
