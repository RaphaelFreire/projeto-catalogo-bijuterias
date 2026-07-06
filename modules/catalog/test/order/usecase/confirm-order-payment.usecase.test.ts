import {
  ConfirmOrderPayment,
  Order,
  OrderNotFoundError,
} from "../../../src/order";
import { FakeOrderRepository } from "../../mock";

const VALID_ITEM = {
  productId: "11111111-1111-4111-8111-111111111111",
  name: "Produto Teste",
  price: 10,
  quantity: 2,
};

describe("ConfirmOrderPayment", () => {
  test("confirma o pagamento de um pedido existente", async () => {
    const repo = new FakeOrderRepository();
    const order = new Order({
      code: "ABCD1234",
      customerName: "Cliente Teste",
      items: [VALID_ITEM],
      total: 20,
    });
    repo.seed(order);
    const useCase = new ConfirmOrderPayment(repo);

    await useCase.execute({ id: order.id });

    expect(repo.updatedOrders).toHaveLength(1);
    expect(repo.updatedOrders[0].paymentConfirmed).toBe(true);
  });

  test("falha com OrderNotFoundError quando o pedido não existe", async () => {
    const repo = new FakeOrderRepository();
    const useCase = new ConfirmOrderPayment(repo);

    await expect(
      useCase.execute({ id: "22222222-2222-4222-8222-222222222222" }),
    ).rejects.toBeInstanceOf(OrderNotFoundError);

    expect(repo.updatedOrders).toEqual([]);
  });
});
