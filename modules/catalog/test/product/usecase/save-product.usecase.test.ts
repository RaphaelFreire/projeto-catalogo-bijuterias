import { ValidationException } from "@sdd/shared";
import { Product, SaveProduct } from "../../../src/product";
import { FakeProductRepository } from "../../mock";

function seedProduct(
  repo: FakeProductRepository,
  overrides: Partial<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    status: "active" | "inactive" | "draft";
    bestSeller: boolean;
    dailyDeal: boolean;
    lastUnits: boolean;
  }> = {},
): Product {
  const product = new Product({
    id: overrides.id,
    name: overrides.name ?? "Camiseta Branca",
    description: overrides.description ?? null,
    price: overrides.price ?? 99.9,
    status: overrides.status ?? "active",
    bestSeller: overrides.bestSeller,
    dailyDeal: overrides.dailyDeal,
    lastUnits: overrides.lastUnits,
  });
  repo.seed(product);
  return product;
}

describe("SaveProduct", () => {
  test("cria novo produto sem id e persiste via create com defaults dos booleanos", async () => {
    const repo = new FakeProductRepository();
    const useCase = new SaveProduct(repo);

    await expect(
      useCase.execute({
        name: "Camiseta Branca",
        price: 99.9,
        status: "active",
      }),
    ).resolves.toBeUndefined();

    expect(repo.createdProducts).toHaveLength(1);
    expect(repo.updatedProducts).toHaveLength(0);
    const created = repo.createdProducts[0];
    expect(created.description).toBeNull();
    expect(created.bestSeller).toBe(false);
    expect(created.dailyDeal).toBe(false);
    expect(created.lastUnits).toBe(false);
  });

  test("cria com id enviado quando produto não existe no repositório", async () => {
    const repo = new FakeProductRepository();
    const useCase = new SaveProduct(repo);
    const id = "11111111-1111-4111-8111-111111111111";

    await useCase.execute({
      id,
      name: "Camiseta Branca",
      price: 50,
      status: "draft",
    });

    expect(repo.createdProducts).toHaveLength(1);
    expect(repo.createdProducts[0].id).toBe(id);
    expect(repo.updatedProducts).toHaveLength(0);
  });

  test("atualiza produto existente quando id é encontrado", async () => {
    const repo = new FakeProductRepository();
    const existing = seedProduct(repo, {
      name: "Camiseta Branca",
      price: 99.9,
      status: "draft",
      dailyDeal: false,
    });
    const useCase = new SaveProduct(repo);

    await useCase.execute({
      id: existing.id,
      name: "Camiseta Premium",
      description: "Algodão peruano",
      price: 149.9,
      status: "active",
      bestSeller: true,
      dailyDeal: true,
      lastUnits: true,
    });

    expect(repo.updatedProducts).toHaveLength(1);
    expect(repo.createdProducts).toHaveLength(0);
    const updated = repo.updatedProducts[0];
    expect(updated.id).toBe(existing.id);
    expect(updated.name).toBe("Camiseta Premium");
    expect(updated.description).toBe("Algodão peruano");
    expect(updated.price).toBe(149.9);
    expect(updated.status).toBe("active");
    expect(updated.bestSeller).toBe(true);
    expect(updated.dailyDeal).toBe(true);
    expect(updated.lastUnits).toBe(true);
  });

  test("falha com ValidationException quando nome tem menos de 2 caracteres", async () => {
    const repo = new FakeProductRepository();
    const useCase = new SaveProduct(repo);

    await expect(
      useCase.execute({
        name: "A",
        price: 10,
        status: "active",
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdProducts).toEqual([]);
  });

  test("falha com ValidationException quando preço é negativo", async () => {
    const repo = new FakeProductRepository();
    const useCase = new SaveProduct(repo);

    await expect(
      useCase.execute({
        name: "Camiseta",
        price: -1,
        status: "active",
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdProducts).toEqual([]);
  });

  test("falha com ValidationException quando status está fora do enum", async () => {
    const repo = new FakeProductRepository();
    const useCase = new SaveProduct(repo);

    await expect(
      useCase.execute({
        name: "Camiseta",
        price: 10,
        status: "archived" as never,
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdProducts).toEqual([]);
  });

  test("falha com ValidationException quando preço tem mais de 2 casas decimais", async () => {
    const repo = new FakeProductRepository();
    const useCase = new SaveProduct(repo);

    await expect(
      useCase.execute({
        name: "Camiseta",
        price: 10.123,
        status: "active",
      }),
    ).rejects.toThrow(ValidationException);
  });

  test("cria produto sem categoryId, permanecendo null", async () => {
    const repo = new FakeProductRepository();
    const useCase = new SaveProduct(repo);

    await useCase.execute({
      name: "Camiseta Branca",
      price: 99.9,
      status: "active",
    });

    expect(repo.createdProducts[0].categoryId).toBeNull();
    expect(repo.createdProducts[0].images).toEqual([]);
  });

  test("cria produto com categoryId e images válidos", async () => {
    const repo = new FakeProductRepository();
    const useCase = new SaveProduct(repo);
    const categoryId = "11111111-1111-4111-8111-111111111111";

    await useCase.execute({
      name: "Camiseta Branca",
      price: 99.9,
      status: "active",
      categoryId,
      images: [
        "https://cdn.example.com/a.png",
        "https://cdn.example.com/b.png",
      ],
    });

    expect(repo.createdProducts[0].categoryId).toBe(categoryId);
    expect(repo.createdProducts[0].images).toEqual([
      "https://cdn.example.com/a.png",
      "https://cdn.example.com/b.png",
    ]);
  });

  test("falha com ValidationException quando categoryId não é um uuid válido", async () => {
    const repo = new FakeProductRepository();
    const useCase = new SaveProduct(repo);

    await expect(
      useCase.execute({
        name: "Camiseta",
        price: 10,
        status: "active",
        categoryId: "not-a-uuid",
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdProducts).toEqual([]);
  });

  test("falha com ValidationException quando images excede o limite máximo de itens", async () => {
    const repo = new FakeProductRepository();
    const useCase = new SaveProduct(repo);

    await expect(
      useCase.execute({
        name: "Camiseta",
        price: 10,
        status: "active",
        images: Array.from(
          { length: 9 },
          (_, i) => `https://cdn.example.com/${i}.png`,
        ),
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdProducts).toEqual([]);
  });

  test("falha com ValidationException quando images contém uma URL inválida", async () => {
    const repo = new FakeProductRepository();
    const useCase = new SaveProduct(repo);

    await expect(
      useCase.execute({
        name: "Camiseta",
        price: 10,
        status: "active",
        images: ["not-a-url"],
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdProducts).toEqual([]);
  });

  test("atualização troca categoryId quando informado explicitamente", async () => {
    const repo = new FakeProductRepository();
    const originalCategoryId = "11111111-1111-4111-8111-111111111111";
    const newCategoryId = "22222222-2222-4222-8222-222222222222";
    const existing = new Product({
      name: "Camiseta Branca",
      price: 99.9,
      status: "draft",
      categoryId: originalCategoryId,
    });
    repo.seed(existing);
    const useCase = new SaveProduct(repo);

    await useCase.execute({
      id: existing.id,
      name: "Camiseta Premium",
      price: 149.9,
      status: "active",
      categoryId: newCategoryId,
    });

    const updated = repo.updatedProducts[repo.updatedProducts.length - 1];
    expect(updated.categoryId).toBe(newCategoryId);
  });

  test("atualização preserva categoryId e images quando não informados", async () => {
    const repo = new FakeProductRepository();
    const categoryId = "11111111-1111-4111-8111-111111111111";
    const existing = new Product({
      name: "Camiseta Branca",
      price: 99.9,
      status: "draft",
      categoryId,
      images: ["https://cdn.example.com/a.png"],
    });
    repo.seed(existing);
    const useCase = new SaveProduct(repo);

    await useCase.execute({
      id: existing.id,
      name: "Camiseta Premium",
      price: 149.9,
      status: "active",
    });

    const updated = repo.updatedProducts[repo.updatedProducts.length - 1];
    expect(updated.categoryId).toBe(categoryId);
    expect(updated.images).toEqual(["https://cdn.example.com/a.png"]);
  });
});
