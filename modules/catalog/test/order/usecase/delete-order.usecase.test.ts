import { DeleteOrder, Order, OrderNotFoundError } from "../../../src/order";
import { FakeOrderRepository } from "../../mock";

const VALID_ITEM = {
  productId: "11111111-1111-4111-8111-111111111111",
  name: "Produto Teste",
  price: 10,
  quantity: 2,
};

describe("DeleteOrder", () => {
  test("remove pedido existente do repositório", async () => {
    const repo = new FakeOrderRepository();
    const order = new Order({
      code: "ABCD1234",
      customerName: "Cliente Teste",
      items: [VALID_ITEM],
      total: 20,
    });
    repo.seed(order);
    const useCase = new DeleteOrder(repo);

    await useCase.execute({ id: order.id });

    expect(repo.deletedIds).toEqual([order.id]);
    await expect(repo.findById(order.id)).resolves.toBeNull();
  });

  test("falha com OrderNotFoundError quando o pedido não existe e não toca o repositório", async () => {
    const repo = new FakeOrderRepository();
    const deleteSpy = jest.spyOn(repo, "delete");
    const useCase = new DeleteOrder(repo);

    await expect(
      useCase.execute({ id: "33333333-3333-4333-8333-333333333333" }),
    ).rejects.toBeInstanceOf(OrderNotFoundError);

    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
