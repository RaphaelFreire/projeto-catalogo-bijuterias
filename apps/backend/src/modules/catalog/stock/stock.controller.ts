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
} from '@nestjs/common';
import {
  DeleteStock,
  SaveStock,
  Stock,
  StockNotFoundError,
} from '@sdd/catalog';
import type { SaveStockIn } from '@sdd/catalog';
import { PrismaStockRepository } from './stock.prisma';
import { PrismaProductRepository } from '../product/product.prisma';

interface StockResponse {
  id: string;
  productId: string;
  productName: string | null;
  quantity: number;
}

interface StockPageResponse {
  items: StockResponse[];
  total: number;
  page: number;
  perPage: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

@Controller('stock')
export class StockController {
  constructor(
    private readonly stockRepository: PrismaStockRepository,
    private readonly productRepository: PrismaProductRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: SaveStockIn): Promise<void> {
    const useCase = new SaveStock(this.stockRepository);
    await useCase.execute(body);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() body: Omit<SaveStockIn, 'id'>,
  ): Promise<void> {
    const useCase = new SaveStock(this.stockRepository);
    await useCase.execute({ ...body, id });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    const useCase = new DeleteStock(this.stockRepository);
    await useCase.execute({ id });
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<StockResponse> {
    const stock = await this.stockRepository.findById(id);
    if (!stock) {
      throw new StockNotFoundError();
    }
    return this.toResponse(stock, await this.productRepository.findById(stock.productId));
  }

  @Get()
  async findPage(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ): Promise<StockPageResponse> {
    const pageNumber = parsePositiveInt(page) ?? DEFAULT_PAGE;
    const perPageNumber = parsePositiveInt(perPage) ?? DEFAULT_PER_PAGE;
    const result = await this.stockRepository.findPage({
      page: pageNumber,
      perPage: perPageNumber,
    });

    const items = await Promise.all(
      result.items.map(async (stock) =>
        this.toResponse(stock, await this.productRepository.findById(stock.productId)),
      ),
    );

    return {
      items,
      total: result.total,
      page: result.page,
      perPage: result.perPage,
    };
  }

  private toResponse(
    stock: Stock,
    product: { name: string } | null,
  ): StockResponse {
    return {
      id: stock.id,
      productId: stock.productId,
      productName: product?.name ?? null,
      quantity: stock.quantity,
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
