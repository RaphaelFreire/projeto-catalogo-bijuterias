import { ValidationException } from "@sdd/shared";
import { SaveUser, User } from "../../../src/user";
import { FakeCryptoProvider, FakeUserRepository } from "../../mock";

const VALID_HASH =
  "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

function seedUser(
  repo: FakeUserRepository,
  overrides: Partial<{
    id: string;
    name: string;
    email: string;
    password: string;
  }> = {},
): User {
  const user = new User({
    id: overrides.id,
    name: overrides.name ?? "Joao Silva",
    email: overrides.email ?? "joao@silva.com",
    password: overrides.password ?? VALID_HASH,
  });
  repo.seed(user);
  return user;
}

describe("SaveUser", () => {
  test("cria novo usuário sem id, hasheando senha e persistindo via create", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const useCase = new SaveUser(cryptoProvider, userRepository);

    await expect(
      useCase.execute({
        name: "Joao Silva",
        email: "joao@silva.com",
        password: "Strong@123",
      }),
    ).resolves.toBeUndefined();

    expect(cryptoProvider.hashedPasswords).toEqual(["Strong@123"]);
    expect(userRepository.createdUsers).toHaveLength(1);
    expect(userRepository.updatedUsers).toHaveLength(0);
    expect(userRepository.createdUsers[0].password).toBe(VALID_HASH);
  });

  test("cria com id enviado quando usuário não existe no repositório", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const useCase = new SaveUser(cryptoProvider, userRepository);
    const id = "11111111-1111-4111-8111-111111111111";

    await useCase.execute({
      id,
      name: "Joao Silva",
      email: "joao@silva.com",
      password: "Strong@123",
    });

    expect(userRepository.createdUsers).toHaveLength(1);
    expect(userRepository.createdUsers[0].id).toBe(id);
    expect(userRepository.updatedUsers).toHaveLength(0);
  });

  test("atualiza usuário existente quando id é encontrado no repositório", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const existing = seedUser(userRepository);
    const useCase = new SaveUser(cryptoProvider, userRepository);

    await useCase.execute({
      id: existing.id,
      name: "Joao Atualizado",
      email: "novo@silva.com",
      password: "Outra@456",
    });

    expect(userRepository.updatedUsers).toHaveLength(1);
    expect(userRepository.createdUsers).toHaveLength(0);
    expect(userRepository.updatedUsers[0].id).toBe(existing.id);
    expect(userRepository.updatedUsers[0].name).toBe("Joao Atualizado");
    expect(userRepository.updatedUsers[0].email).toBe("novo@silva.com");
  });

  test("atualização sem password mantém o hash atual e não chama hashPassword", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const existing = seedUser(userRepository);
    const hashSpy = jest.spyOn(cryptoProvider, "hash");
    const useCase = new SaveUser(cryptoProvider, userRepository);

    await useCase.execute({
      id: existing.id,
      name: "Joao Atualizado",
      email: "novo@silva.com",
    });

    expect(hashSpy).not.toHaveBeenCalled();
    expect(userRepository.updatedUsers).toHaveLength(1);
    expect(userRepository.updatedUsers[0].password).toBe(VALID_HASH);
  });

  test("atualização com password vazio mantém o hash atual e não chama hashPassword", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const existing = seedUser(userRepository);
    const hashSpy = jest.spyOn(cryptoProvider, "hash");
    const useCase = new SaveUser(cryptoProvider, userRepository);

    await useCase.execute({
      id: existing.id,
      name: "Joao Atualizado",
      email: "novo@silva.com",
      password: "",
    });

    expect(hashSpy).not.toHaveBeenCalled();
    expect(userRepository.updatedUsers[0].password).toBe(VALID_HASH);
  });

  test("atualização trocando password chama hashPassword e substitui hash", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const existing = seedUser(userRepository, {
      password: "$2b$10$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    });
    const useCase = new SaveUser(cryptoProvider, userRepository);

    await useCase.execute({
      id: existing.id,
      name: "Joao Atualizado",
      email: "novo@silva.com",
      password: "Outra@456",
    });

    expect(cryptoProvider.hashedPasswords).toEqual(["Outra@456"]);
    expect(userRepository.updatedUsers[0].password).toBe(VALID_HASH);
  });

  test("falha com ValidationException quando criação tem senha fraca e não persiste", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const useCase = new SaveUser(cryptoProvider, userRepository);

    await expect(
      useCase.execute({
        name: "Joao Silva",
        email: "joao@silva.com",
        password: "123",
      }),
    ).rejects.toThrow(ValidationException);

    expect(userRepository.createdUsers).toEqual([]);
  });

  test("falha com ValidationException quando atualização troca para senha fraca", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const existing = seedUser(userRepository);
    const useCase = new SaveUser(cryptoProvider, userRepository);

    await expect(
      useCase.execute({
        id: existing.id,
        name: "Joao Silva",
        email: "joao@silva.com",
        password: "123",
      }),
    ).rejects.toThrow(ValidationException);

    expect(userRepository.updatedUsers).toEqual([]);
  });
});
