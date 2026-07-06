import { CryptoProvider } from "../../src/user";

export class FakeCryptoProvider implements CryptoProvider {
  readonly hashedPasswords: string[] = [];

  hash(plain: string): Promise<string> {
    this.hashedPasswords.push(plain);
    return Promise.resolve(
      `$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW`,
    );
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return Promise.resolve(Boolean(plain) && Boolean(hash));
  }
}
