import {
  DeleteProduct,
  Product,
  ProductNotFoundError,
} from "../../../src/product";
import { FakeProductRepository } from "../../mock";

describe("DeleteProduct", () => {
  test("remove produto existente do repositório", async () => {
    const repo = new FakeProductRepository();
    const product = new Product({
      name: "Camiseta Branca",
      price: 99.9,
      status: "active",
    });
    repo.seed(product);
    const useCase = new DeleteProduct(repo);

    await useCase.execute({ id: product.id });

    expect(repo.deletedIds).toEqual([product.id]);
    await expect(repo.findById(product.id)).resolves.toBeNull();
  });

  test("falha com ProductNotFoundError quando id não existe e não toca repositório", async () => {
    const repo = new FakeProductRepository();
    const deleteSpy = jest.spyOn(repo, "delete");
    const useCase = new DeleteProduct(repo);

    await expect(
      useCase.execute({ id: "11111111-1111-4111-8111-111111111111" }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(repo.deletedIds).toEqual([]);
  });

  test("ProductNotFoundError tem statusCode 404 e mensagem product.not_found", async () => {
    const repo = new FakeProductRepository();
    const useCase = new DeleteProduct(repo);

    await expect(
      useCase.execute({ id: "22222222-2222-4222-8222-222222222222" }),
    ).rejects.toMatchObject({
      message: "product.not_found",
      statusCode: 404,
    });
  });
});
