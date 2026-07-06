import { ValidationException } from "@sdd/shared";
import { User, UserState } from "../../../src/user/model/user.entity";

const VALID_HASH =
  "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

function buildState(overrides: Partial<UserState> = {}): UserState {
  return {
    name: "Maria Silva",
    email: "maria@example.com",
    password: VALID_HASH,
    ...overrides,
  };
}

function getValidationMessages(callback: () => void): string[] {
  try {
    callback();
    return [];
  } catch (error) {
    return (error as ValidationException).errors.map((item) => item.message);
  }
}

describe("User entity", () => {
  it("instancia entidade valida com getters e timestamps", () => {
    const user = new User(buildState());

    expect(user.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(user.name).toBe("Maria Silva");
    expect(user.email).toBe("maria@example.com");
    expect(user.password).toBe(VALID_HASH);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
    expect(user.deletedAt).toBeNull();
  });

  it("valida sem erros para dados validos", () => {
    const user = new User(buildState());
    expect(() => user.validate()).not.toThrow();
  });

  it("valida lazy: aceita instancia invalida ate validate ser chamado", () => {
    const user = new User(
      buildState({ name: "x", email: "nope", password: "abc" }),
    );
    expect(() => user.validate()).toThrow(ValidationException);
  });

  it("acumula erros para name vazio, email invalido e password sem hash", () => {
    const user = new User(
      buildState({ name: "", email: "no", password: "abc" }),
    );

    const messages = getValidationMessages(() => user.validate());

    expect(messages).toEqual(
      expect.arrayContaining([
        expect.stringContaining("user.name"),
        expect.stringContaining("user.email.invalid.email"),
        expect.stringContaining("user.password.bcrypt.hash"),
      ]),
    );
  });

  it("rejeita name muito curto e que nao casa com person name", () => {
    const user = new User(buildState({ name: "Ab" }));
    const messages = getValidationMessages(() => user.validate());
    expect(messages.some((m) => m.includes("user.name"))).toBe(true);
  });

  it("rejeita name maior que o limite", () => {
    const user = new User(buildState({ name: "a ".repeat(60).trim() }));
    const messages = getValidationMessages(() => user.validate());
    expect(messages.some((m) => m.includes("user.name"))).toBe(true);
  });

  it("preserva id e createdAt no clone e atualiza updatedAt", () => {
    const user = new User(buildState());
    const originalUpdated = user.updatedAt.getTime();

    const clone = user.clone({ name: "Joao Souza" });

    expect(clone.id).toBe(user.id);
    expect(clone.createdAt.getTime()).toBe(user.createdAt.getTime());
    expect(clone.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdated);
    expect(clone.name).toBe("Joao Souza");
    expect(clone.email).toBe(user.email);
  });
});
