import { DeleteStock, Stock, StockNotFoundError } from "../../../src/stock";
import { FakeStockRepository } from "../../mock";

describe("DeleteStock", () => {
  test("remove estoque existente do repositório", async () => {
    const repo = new FakeStockRepository();
    const stock = new Stock({
      productId: "11111111-1111-4111-8111-111111111111",
      quantity: 0,
    });
    repo.seed(stock);
    const useCase = new DeleteStock(repo);

    await useCase.execute({ id: stock.id });

    expect(repo.deletedIds).toEqual([stock.id]);
    await expect(repo.findById(stock.id)).resolves.toBeNull();
  });

  test("falha com StockNotFoundError quando id não existe e não toca repositório", async () => {
    const repo = new FakeStockRepository();
    const deleteSpy = jest.spyOn(repo, "delete");
    const useCase = new DeleteStock(repo);

    await expect(
      useCase.execute({ id: "22222222-2222-4222-8222-222222222222" }),
    ).rejects.toBeInstanceOf(StockNotFoundError);

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(repo.deletedIds).toEqual([]);
  });

  test("StockNotFoundError tem statusCode 404 e mensagem stock.not_found", async () => {
    const repo = new FakeStockRepository();
    const useCase = new DeleteStock(repo);

    await expect(
      useCase.execute({ id: "33333333-3333-4333-8333-333333333333" }),
    ).rejects.toMatchObject({
      message: "stock.not_found",
      statusCode: 404,
    });
  });
});
