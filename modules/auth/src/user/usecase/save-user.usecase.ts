import {
  EmailRule,
  RequiredRule,
  StrongPasswordRule,
  UseCase,
  Validator,
} from "@sdd/shared";
import { User } from "../model";
import { CryptoProvider, UserRepository } from "../provider";

export interface SaveUserIn {
  id?: string;
  name: string;
  email: string;
  password?: string;
}

export class SaveUser implements UseCase<SaveUserIn, void> {
  constructor(
    private readonly cryptoProvider: CryptoProvider,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: SaveUserIn): Promise<void> {
    const existing = input.id
      ? await this.userRepository.findById(input.id)
      : null;

    if (existing) {
      await this.update(existing, input);
      return;
    }

    await this.create(input);
  }

  private async update(existing: User, input: SaveUserIn): Promise<void> {
    const hasPassword = Boolean(input.password);

    Validator.validate([
      {
        code: "user.name",
        value: input.name,
        rules: [new RequiredRule()],
      },
      {
        code: "user.email",
        value: input.email,
        rules: [new RequiredRule(), new EmailRule()],
      },
      ...(hasPassword
        ? [
            {
              code: "user.password",
              value: input.password!,
              rules: [new StrongPasswordRule()],
            },
          ]
        : []),
    ]);

    const password = hasPassword
      ? await this.cryptoProvider.hash(input.password!)
      : existing.password;

    const updated = existing.clone({
      name: input.name,
      email: input.email,
      password,
    });

    updated.validate();

    await this.userRepository.update(updated);
  }

  private async create(input: SaveUserIn): Promise<void> {
    Validator.validate([
      {
        code: "user.name",
        value: input.name,
        rules: [new RequiredRule()],
      },
      {
        code: "user.email",
        value: input.email,
        rules: [new RequiredRule(), new EmailRule()],
      },
      {
        code: "user.password",
        value: input.password,
        rules: [new RequiredRule(), new StrongPasswordRule()],
      },
    ]);

    const password = await this.cryptoProvider.hash(input.password!);

    const user = new User({
      id: input.id,
      name: input.name,
      email: input.email,
      password,
    });

    user.validate();

    await this.userRepository.create(user);
  }
}
