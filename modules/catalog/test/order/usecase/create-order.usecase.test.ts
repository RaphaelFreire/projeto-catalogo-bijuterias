import { DomainError, ValidationException } from "@sdd/shared";
import { CreateOrder, Order, OrderItem } from "../../../src/order";
import { FakeOrderRepository } from "../../mock";

const VALID_ITEM: OrderItem = {
  productId: "11111111-1111-4111-8111-111111111111",
  name: "Produto Teste",
  price: 10,
  quantity: 2,
};

describe("CreateOrder", () => {
  test("cria pedido com itens válidos e calcula o total corretamente", async () => {
    const repo = new FakeOrderRepository();
    const useCase = new CreateOrder(repo);

    const code = await useCase.execute({
      customerName: "Cliente Teste",
      items: [
        VALID_ITEM,
        {
          ...VALID_ITEM,
          productId: "22222222-2222-4222-8222-222222222222",
          price: 5,
          quantity: 3,
        },
      ],
    });

    expect(repo.createdOrders).toHaveLength(1);
    expect(repo.createdOrders[0].total).toBe(35);
    expect(repo.createdOrders[0].customerName).toBe("Cliente Teste");
    expect(code).toBe(repo.createdOrders[0].code);
  });

  test("gera um code de 8 caracteres alfanuméricos maiúsculos", async () => {
    const repo = new FakeOrderRepository();
    const useCase = new CreateOrder(repo);

    const code = await useCase.execute({
      customerName: "Cliente Teste",
      items: [VALID_ITEM],
    });

    expect(code).toMatch(/^[A-Z0-9]{8}$/);
  });

  test("gera outro code em caso de colisão simulada", async () => {
    const repo = new FakeOrderRepository();
    let callCount = 0;
    const findByCodeSpy = jest
      .spyOn(repo, "findByCode")
      .mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) {
          return Promise.resolve(
            new Order({
              code: "AAAAAAAA",
              customerName: "Outro Cliente",
              items: [VALID_ITEM],
              total: 20,
            }),
          );
        }
        return Promise.resolve(null);
      });
    const useCase = new CreateOrder(repo);

    await useCase.execute({
      customerName: "Cliente Teste",
      items: [VALID_ITEM],
    });

    expect(findByCodeSpy).toHaveBeenCalledTimes(2);
    expect(repo.createdOrders).toHaveLength(1);
  });

  test("falha com DomainError quando todas as tentativas de gerar code colidem", async () => {
    const repo = new FakeOrderRepository();
    jest.spyOn(repo, "findByCode").mockImplementation(() =>
      Promise.resolve(
        new Order({
          code: "AAAAAAAA",
          customerName: "Outro Cliente",
          items: [VALID_ITEM],
          total: 20,
        }),
      ),
    );
    const useCase = new CreateOrder(repo);

    await expect(
      useCase.execute({ customerName: "Cliente Teste", items: [VALID_ITEM] }),
    ).rejects.toThrow(DomainError);

    expect(repo.createdOrders).toEqual([]);
  });

  test("falha com ValidationException quando customerName é muito curto", async () => {
    const repo = new FakeOrderRepository();
    const useCase = new CreateOrder(repo);

    await expect(
      useCase.execute({ customerName: "A", items: [VALID_ITEM] }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdOrders).toEqual([]);
  });

  test("falha com ValidationException quando items está vazio", async () => {
    const repo = new FakeOrderRepository();
    const useCase = new CreateOrder(repo);

    await expect(
      useCase.execute({ customerName: "Cliente Teste", items: [] }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdOrders).toEqual([]);
  });

  test("falha com ValidationException quando um item tem quantity menor que 1", async () => {
    const repo = new FakeOrderRepository();
    const useCase = new CreateOrder(repo);

    await expect(
      useCase.execute({
        customerName: "Cliente Teste",
        items: [{ ...VALID_ITEM, quantity: 0 }],
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdOrders).toEqual([]);
  });

  test("falha com ValidationException quando um item tem productId inválido", async () => {
    const repo = new FakeOrderRepository();
    const useCase = new CreateOrder(repo);

    await expect(
      useCase.execute({
        customerName: "Cliente Teste",
        items: [{ ...VALID_ITEM, productId: "not-a-uuid" }],
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdOrders).toEqual([]);
  });

  test("falha com ValidationException quando um item tem price negativo", async () => {
    const repo = new FakeOrderRepository();
    const useCase = new CreateOrder(repo);

    await expect(
      useCase.execute({
        customerName: "Cliente Teste",
        items: [{ ...VALID_ITEM, price: -1 }],
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdOrders).toEqual([]);
  });
});
