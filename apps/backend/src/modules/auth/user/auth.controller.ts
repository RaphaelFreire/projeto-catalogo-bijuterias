import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginUser, RegisterUser } from '@sdd/auth';
import type { LoginUserIn, LoginUserOut, RegisterUserIn } from '@sdd/auth';
import { Public } from '../../../shared/decorators/public.decorator';
import { BcryptCryptoProvider } from './crypto.provider';
import { signUserToken } from './jwt.util';
import { PrismaUserRepository } from './user.prisma';

interface LoginResponse {
  token: string;
  user: LoginUserOut;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userRepository: PrismaUserRepository,
    private readonly cryptoProvider: BcryptCryptoProvider,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterUserIn): Promise<void> {
    const useCase = new RegisterUser(this.cryptoProvider, this.userRepository);
    await useCase.execute(body);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginUserIn): Promise<LoginResponse> {
    const useCase = new LoginUser(this.cryptoProvider, this.userRepository);
    const user = await useCase.execute(body);
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET não configurado');
    }
    const token = signUserToken(user, secret);
    return { token, user };
  }
}
