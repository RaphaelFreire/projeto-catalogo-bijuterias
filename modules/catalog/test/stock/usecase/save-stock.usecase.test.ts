import { ValidationException } from "@sdd/shared";
import { SaveStock, Stock, StockAlreadyExistsError } from "../../../src/stock";
import { FakeStockRepository } from "../../mock";

const PRODUCT_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_PRODUCT_ID = "22222222-2222-4222-8222-222222222222";

function seedStock(
  repo: FakeStockRepository,
  overrides: Partial<{ id: string; productId: string; quantity: number }> = {},
): Stock {
  const stock = new Stock({
    id: overrides.id,
    productId: overrides.productId ?? PRODUCT_ID,
    quantity: overrides.quantity ?? 0,
  });
  repo.seed(stock);
  return stock;
}

describe("SaveStock", () => {
  test("cria novo estoque sem id e persiste via create", async () => {
    const repo = new FakeStockRepository();
    const useCase = new SaveStock(repo);

    await expect(
      useCase.execute({ productId: PRODUCT_ID, quantity: 0 }),
    ).resolves.toBeUndefined();

    expect(repo.createdStocks).toHaveLength(1);
    expect(repo.updatedStocks).toHaveLength(0);
    expect(repo.createdStocks[0].productId).toBe(PRODUCT_ID);
    expect(repo.createdStocks[0].quantity).toBe(0);
  });

  test("falha com StockAlreadyExistsError quando productId já tem estoque", async () => {
    const repo = new FakeStockRepository();
    seedStock(repo, { productId: PRODUCT_ID });
    const useCase = new SaveStock(repo);

    await expect(
      useCase.execute({ productId: PRODUCT_ID, quantity: 5 }),
    ).rejects.toBeInstanceOf(StockAlreadyExistsError);

    expect(repo.createdStocks).toEqual([]);
  });

  test("cria estoque para produto diferente sem conflito", async () => {
    const repo = new FakeStockRepository();
    seedStock(repo, { productId: PRODUCT_ID });
    const useCase = new SaveStock(repo);

    await useCase.execute({ productId: OTHER_PRODUCT_ID, quantity: 10 });

    expect(repo.createdStocks).toHaveLength(1);
    expect(repo.createdStocks[0].productId).toBe(OTHER_PRODUCT_ID);
  });

  test("atualiza quantidade de estoque existente, mantendo o productId original", async () => {
    const repo = new FakeStockRepository();
    const existing = seedStock(repo, { productId: PRODUCT_ID, quantity: 3 });
    const useCase = new SaveStock(repo);

    await useCase.execute({
      id: existing.id,
      productId: PRODUCT_ID,
      quantity: 20,
    });

    expect(repo.updatedStocks).toHaveLength(1);
    expect(repo.createdStocks).toHaveLength(0);
    expect(repo.updatedStocks[0].id).toBe(existing.id);
    expect(repo.updatedStocks[0].productId).toBe(PRODUCT_ID);
    expect(repo.updatedStocks[0].quantity).toBe(20);
  });

  test("falha com ValidationException quando quantity é negativa", async () => {
    const repo = new FakeStockRepository();
    const useCase = new SaveStock(repo);

    await expect(
      useCase.execute({ productId: PRODUCT_ID, quantity: -1 }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdStocks).toEqual([]);
  });

  test("falha com ValidationException quando quantity não é inteira", async () => {
    const repo = new FakeStockRepository();
    const useCase = new SaveStock(repo);

    await expect(
      useCase.execute({ productId: PRODUCT_ID, quantity: 1.5 }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdStocks).toEqual([]);
  });

  test("falha com ValidationException quando productId não é um uuid válido", async () => {
    const repo = new FakeStockRepository();
    const useCase = new SaveStock(repo);

    await expect(
      useCase.execute({ productId: "not-a-uuid", quantity: 1 }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdStocks).toEqual([]);
  });
});
