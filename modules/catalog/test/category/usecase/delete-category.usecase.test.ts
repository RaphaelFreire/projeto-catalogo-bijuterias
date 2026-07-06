import {
  Category,
  CategoryNotFoundError,
  DeleteCategory,
} from "../../../src/category";
import { FakeCategoryRepository } from "../../mock";

describe("DeleteCategory", () => {
  test("remove categoria existente do repositório", async () => {
    const repo = new FakeCategoryRepository();
    const category = new Category({ name: "Camisetas" });
    repo.seed(category);
    const useCase = new DeleteCategory(repo);

    await useCase.execute({ id: category.id });

    expect(repo.deletedIds).toEqual([category.id]);
    await expect(repo.findById(category.id)).resolves.toBeNull();
  });

  test("falha com CategoryNotFoundError quando id não existe e não toca repositório", async () => {
    const repo = new FakeCategoryRepository();
    const deleteSpy = jest.spyOn(repo, "delete");
    const useCase = new DeleteCategory(repo);

    await expect(
      useCase.execute({ id: "11111111-1111-4111-8111-111111111111" }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(repo.deletedIds).toEqual([]);
  });

  test("CategoryNotFoundError tem statusCode 404 e mensagem category.not_found", async () => {
    const repo = new FakeCategoryRepository();
    const useCase = new DeleteCategory(repo);

    await expect(
      useCase.execute({ id: "22222222-2222-4222-8222-222222222222" }),
    ).rejects.toMatchObject({
      message: "category.not_found",
      statusCode: 404,
    });
  });
});
