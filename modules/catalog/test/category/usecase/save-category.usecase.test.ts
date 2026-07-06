import { ValidationException } from "@sdd/shared";
import { Category, SaveCategory } from "../../../src/category";
import { FakeCategoryRepository } from "../../mock";

function seedCategory(
  repo: FakeCategoryRepository,
  overrides: Partial<{ id: string; name: string }> = {},
): Category {
  const category = new Category({
    id: overrides.id,
    name: overrides.name ?? "Camisetas",
  });
  repo.seed(category);
  return category;
}

describe("SaveCategory", () => {
  test("cria nova categoria sem id e persiste via create", async () => {
    const repo = new FakeCategoryRepository();
    const useCase = new SaveCategory(repo);

    await expect(
      useCase.execute({ name: "Camisetas" }),
    ).resolves.toBeUndefined();

    expect(repo.createdCategories).toHaveLength(1);
    expect(repo.updatedCategories).toHaveLength(0);
    expect(repo.createdCategories[0].name).toBe("Camisetas");
  });

  test("cria com id enviado quando categoria não existe no repositório", async () => {
    const repo = new FakeCategoryRepository();
    const useCase = new SaveCategory(repo);
    const id = "11111111-1111-4111-8111-111111111111";

    await useCase.execute({ id, name: "Camisetas" });

    expect(repo.createdCategories).toHaveLength(1);
    expect(repo.createdCategories[0].id).toBe(id);
    expect(repo.updatedCategories).toHaveLength(0);
  });

  test("atualiza categoria existente quando id é encontrado", async () => {
    const repo = new FakeCategoryRepository();
    const existing = seedCategory(repo, { name: "Camisetas" });
    const useCase = new SaveCategory(repo);

    await useCase.execute({ id: existing.id, name: "Camisetas Premium" });

    expect(repo.updatedCategories).toHaveLength(1);
    expect(repo.createdCategories).toHaveLength(0);
    expect(repo.updatedCategories[0].id).toBe(existing.id);
    expect(repo.updatedCategories[0].name).toBe("Camisetas Premium");
  });

  test("falha com ValidationException quando nome tem menos de 2 caracteres", async () => {
    const repo = new FakeCategoryRepository();
    const useCase = new SaveCategory(repo);

    await expect(useCase.execute({ name: "A" })).rejects.toThrow(
      ValidationException,
    );

    expect(repo.createdCategories).toEqual([]);
  });

  test("falha com ValidationException quando nome tem mais de 120 caracteres", async () => {
    const repo = new FakeCategoryRepository();
    const useCase = new SaveCategory(repo);

    await expect(useCase.execute({ name: "A".repeat(121) })).rejects.toThrow(
      ValidationException,
    );

    expect(repo.createdCategories).toEqual([]);
  });
});
