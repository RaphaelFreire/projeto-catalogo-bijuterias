import { DeleteUser, User, UserNotFoundError } from "../../../src/user";
import { FakeUserRepository } from "../../mock";

const VALID_HASH =
  "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

describe("DeleteUser", () => {
  test("remove usuário existente do repositório", async () => {
    const userRepository = new FakeUserRepository();
    const user = new User({
      name: "Joao Silva",
      email: "joao@silva.com",
      password: VALID_HASH,
    });
    userRepository.seed(user);
    const useCase = new DeleteUser(userRepository);

    await useCase.execute({ id: user.id });

    expect(userRepository.deletedIds).toEqual([user.id]);
    await expect(userRepository.findById(user.id)).resolves.toBeNull();
  });

  test("falha com UserNotFoundError quando id não existe e não toca repositório", async () => {
    const userRepository = new FakeUserRepository();
    const deleteSpy = jest.spyOn(userRepository, "delete");
    const useCase = new DeleteUser(userRepository);

    await expect(
      useCase.execute({ id: "11111111-1111-4111-8111-111111111111" }),
    ).rejects.toBeInstanceOf(UserNotFoundError);

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(userRepository.deletedIds).toEqual([]);
  });

  test("UserNotFoundError tem statusCode 404 e mensagem user.not-found", async () => {
    const userRepository = new FakeUserRepository();
    const useCase = new DeleteUser(userRepository);

    await expect(
      useCase.execute({ id: "22222222-2222-4222-8222-222222222222" }),
    ).rejects.toMatchObject({
      message: "user.not-found",
      statusCode: 404,
    });
  });
});
