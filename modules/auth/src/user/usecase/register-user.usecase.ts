import {
  EmailRule,
  RequiredRule,
  StrongPasswordRule,
  UseCase,
  Validator,
} from "@sdd/shared";
import { EmailAlreadyRegisteredError } from "../error";
import { User } from "../model";
import { CryptoProvider, UserRepository } from "../provider";

export interface RegisterUserIn {
  name: string;
  email: string;
  password: string;
}

export class RegisterUser implements UseCase<RegisterUserIn, void> {
  constructor(
    private readonly cryptoProvider: CryptoProvider,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: RegisterUserIn): Promise<void> {
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

    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new EmailAlreadyRegisteredError();
    }

    const hashedPassword = await this.cryptoProvider.hash(input.password);
    const user = new User({
      name: input.name,
      email: input.email,
      password: hashedPassword,
    });

    user.validate();

    await this.userRepository.create(user);
  }
}
