import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CryptoProvider } from '@sdd/auth';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class BcryptCryptoProvider implements CryptoProvider {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
