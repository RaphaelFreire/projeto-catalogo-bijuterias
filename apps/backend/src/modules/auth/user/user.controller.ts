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
import { DeleteUser, SaveUser, UserNotFoundError } from '@sdd/auth';
import type { SaveUserIn } from '@sdd/auth';
import { BcryptCryptoProvider } from './crypto.provider';
import { PrismaUserRepository } from './user.prisma';

interface UserResponse {
  id: string;
  name: string;
  email: string;
}

interface UserPageResponse {
  items: UserResponse[];
  total: number;
  page: number;
  perPage: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

@Controller('users')
export class UserController {
  constructor(
    private readonly userRepository: PrismaUserRepository,
    private readonly cryptoProvider: BcryptCryptoProvider,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: SaveUserIn): Promise<void> {
    const useCase = new SaveUser(this.cryptoProvider, this.userRepository);
    await useCase.execute(body);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() body: Omit<SaveUserIn, 'id'>,
  ): Promise<void> {
    const useCase = new SaveUser(this.cryptoProvider, this.userRepository);
    await useCase.execute({ ...body, id });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    const useCase = new DeleteUser(this.userRepository);
    await useCase.execute({ id });
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError();
    }
    return { id: user.id, name: user.name, email: user.email };
  }

  @Get()
  async findPage(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ): Promise<UserPageResponse> {
    const pageNumber = parsePositiveInt(page) ?? DEFAULT_PAGE;
    const perPageNumber = parsePositiveInt(perPage) ?? DEFAULT_PER_PAGE;
    const result = await this.userRepository.findPage({
      page: pageNumber,
      perPage: perPageNumber,
    });
    return {
      items: result.items.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      })),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
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
