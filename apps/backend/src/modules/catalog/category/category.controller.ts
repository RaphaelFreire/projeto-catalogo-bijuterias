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
  Category,
  CategoryNotFoundError,
  DeleteCategory,
  SaveCategory,
} from '@sdd/catalog';
import type { SaveCategoryIn } from '@sdd/catalog';
import { PrismaCategoryRepository } from './category.prisma';

interface CategoryResponse {
  id: string;
  name: string;
}

interface CategoryPageResponse {
  items: CategoryResponse[];
  total: number;
  page: number;
  perPage: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryRepository: PrismaCategoryRepository) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: SaveCategoryIn): Promise<void> {
    const useCase = new SaveCategory(this.categoryRepository);
    await useCase.execute(body);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() body: Omit<SaveCategoryIn, 'id'>,
  ): Promise<void> {
    const useCase = new SaveCategory(this.categoryRepository);
    await useCase.execute({ ...body, id });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    const useCase = new DeleteCategory(this.categoryRepository);
    await useCase.execute({ id });
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<CategoryResponse> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new CategoryNotFoundError();
    }
    return this.toResponse(category);
  }

  @Get()
  async findPage(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ): Promise<CategoryPageResponse> {
    const pageNumber = parsePositiveInt(page) ?? DEFAULT_PAGE;
    const perPageNumber = parsePositiveInt(perPage) ?? DEFAULT_PER_PAGE;
    const result = await this.categoryRepository.findPage({
      page: pageNumber,
      perPage: perPageNumber,
    });
    return {
      items: result.items.map((category) => this.toResponse(category)),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
    };
  }

  private toResponse(category: Category): CategoryResponse {
    return {
      id: category.id,
      name: category.name,
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
