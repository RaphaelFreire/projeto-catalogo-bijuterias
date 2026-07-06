import { ValidationException } from "@sdd/shared";
import {
  EmailAlreadyRegisteredError,
  RegisterUser,
  User,
} from "../../../src/user";
import { FakeCryptoProvider, FakeUserRepository } from "../../mock";

const VALID_HASH =
  "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

describe("RegisterUser", () => {
  test("registra usuário novo: valida senha, hashea, valida entidade e persiste", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const validateSpy = jest.spyOn(User.prototype, "validate");
    const useCase = new RegisterUser(cryptoProvider, userRepository);

    await expect(
      useCase.execute({
        name: "Joao Silva",
        email: "joao@silva.com",
        password: "Strong@123",
      }),
    ).resolves.toBeUndefined();

    expect(cryptoProvider.hashedPasswords).toEqual(["Strong@123"]);
    expect(validateSpy).toHaveBeenCalledTimes(1);
    expect(userRepository.createdUsers).toHaveLength(1);
    expect(userRepository.createdUsers[0].password).toBe(VALID_HASH);

    validateSpy.mockRestore();
  });

  test("falha com ValidationException quando senha não é forte e não persiste", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const useCase = new RegisterUser(cryptoProvider, userRepository);

    await expect(
      useCase.execute({
        name: "Joao Silva",
        email: "joao@silva.com",
        password: "123456",
      }),
    ).rejects.toThrow(ValidationException);

    expect(cryptoProvider.hashedPasswords).toEqual([]);
    expect(userRepository.createdUsers).toEqual([]);
  });

  test("falha com EmailAlreadyRegisteredError quando email já cadastrado e não persiste", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    userRepository.seed(
      new User({
        name: "Maria Souza",
        email: "joao@silva.com",
        password: VALID_HASH,
      }),
    );
    const useCase = new RegisterUser(cryptoProvider, userRepository);

    await expect(
      useCase.execute({
        name: "Joao Silva",
        email: "joao@silva.com",
        password: "Strong@123",
      }),
    ).rejects.toThrow(EmailAlreadyRegisteredError);

    expect(cryptoProvider.hashedPasswords).toEqual([]);
    expect(userRepository.createdUsers).toEqual([]);
  });

  test("falha com ValidationException quando entidade fica inválida (ex.: name curto)", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const useCase = new RegisterUser(cryptoProvider, userRepository);

    await expect(
      useCase.execute({
        name: "Jo",
        email: "joao@silva.com",
        password: "Strong@123",
      }),
    ).rejects.toThrow(ValidationException);

    expect(cryptoProvider.hashedPasswords).toEqual(["Strong@123"]);
    expect(userRepository.createdUsers).toEqual([]);
  });
});
