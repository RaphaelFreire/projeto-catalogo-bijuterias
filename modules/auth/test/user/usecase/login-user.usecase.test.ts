import { ValidationException } from "@sdd/shared";
import { InvalidCredentialsError, LoginUser, User } from "../../../src/user";
import { FakeCryptoProvider, FakeUserRepository } from "../../mock";

const VALID_HASH =
  "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

function seedUser(
  repo: FakeUserRepository,
  overrides: Partial<{ name: string; email: string; password: string }> = {},
): User {
  const user = new User({
    name: overrides.name ?? "Joao Silva",
    email: overrides.email ?? "joao@silva.com",
    password: overrides.password ?? VALID_HASH,
  });
  repo.seed(user);
  return user;
}

describe("LoginUser", () => {
  test("login válido devolve { id, name, email } sem password", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const user = seedUser(userRepository);
    const useCase = new LoginUser(cryptoProvider, userRepository);

    const result = await useCase.execute({
      email: "joao@silva.com",
      password: "Strong@123",
    });

    expect(result).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
    });
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("passwordHash");
  });

  test("e-mail inexistente lança InvalidCredentialsError (status 401)", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const useCase = new LoginUser(cryptoProvider, userRepository);

    await expect(
      useCase.execute({
        email: "naoexiste@silva.com",
        password: "Strong@123",
      }),
    ).rejects.toMatchObject({
      message: "user.credentials.invalid",
      statusCode: 401,
    });
    await expect(
      useCase.execute({
        email: "naoexiste@silva.com",
        password: "Strong@123",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  test("senha incorreta lança InvalidCredentialsError (status 401) com mesma mensagem do e-mail inexistente", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    seedUser(userRepository);
    jest.spyOn(cryptoProvider, "compare").mockResolvedValue(false);
    const useCase = new LoginUser(cryptoProvider, userRepository);

    await expect(
      useCase.execute({
        email: "joao@silva.com",
        password: "errada",
      }),
    ).rejects.toMatchObject({
      message: "user.credentials.invalid",
      statusCode: 401,
    });
  });

  test("e-mail vazio falha com ValidationException e não consulta repositório", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const findSpy = jest.spyOn(userRepository, "findByEmail");
    const useCase = new LoginUser(cryptoProvider, userRepository);

    await expect(
      useCase.execute({
        email: "",
        password: "Strong@123",
      }),
    ).rejects.toThrow(ValidationException);
    expect(findSpy).not.toHaveBeenCalled();
  });

  test("e-mail inválido falha com ValidationException e não consulta repositório", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const findSpy = jest.spyOn(userRepository, "findByEmail");
    const useCase = new LoginUser(cryptoProvider, userRepository);

    await expect(
      useCase.execute({
        email: "nao-eh-email",
        password: "Strong@123",
      }),
    ).rejects.toThrow(ValidationException);
    expect(findSpy).not.toHaveBeenCalled();
  });

  test("senha vazia falha com ValidationException e não consulta repositório", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const findSpy = jest.spyOn(userRepository, "findByEmail");
    const useCase = new LoginUser(cryptoProvider, userRepository);

    await expect(
      useCase.execute({
        email: "joao@silva.com",
        password: "",
      }),
    ).rejects.toThrow(ValidationException);
    expect(findSpy).not.toHaveBeenCalled();
  });
});
