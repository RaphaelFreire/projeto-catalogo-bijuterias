import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AuthController } from './user/auth.controller';
import { BcryptCryptoProvider } from './user/crypto.provider';
import { UserController } from './user/user.controller';
import { PrismaUserRepository } from './user/user.prisma';

@Module({
  imports: [DbModule],
  controllers: [AuthController, UserController],
  providers: [PrismaUserRepository, BcryptCryptoProvider],
  exports: [PrismaUserRepository, BcryptCryptoProvider],
})
export class AuthModule {}
