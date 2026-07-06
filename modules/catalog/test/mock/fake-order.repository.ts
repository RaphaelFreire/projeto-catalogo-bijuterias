import { Order, OrderPageParams, OrderRepository } from "../../src/order";

export class FakeOrderRepository implements OrderRepository {
  readonly createdOrders: Order[] = [];
  readonly updatedOrders: Order[] = [];
  readonly deletedIds: string[] = [];
  private store: Order[] = [];

  create(entity: Order): Promise<Order> {
    this.createdOrders.push(entity);
    this.store.push(entity);
    return Promise.resolve(entity);
  }

  update(entity: Order): Promise<Order> {
    this.updatedOrders.push(entity);
    const index = this.store.findIndex((item) => item.id === entity.id);
    if (index >= 0) {
      this.store[index] = entity;
    }
    return Promise.resolve(entity);
  }

  delete(id: string): Promise<void> {
    this.deletedIds.push(id);
    this.store = this.store.filter((item) => item.id !== id);
    return Promise.resolve();
  }

  findById(id: string): Promise<Order | null> {
    return Promise.resolve(this.store.find((item) => item.id === id) ?? null);
  }

  findByCode(code: string): Promise<Order | null> {
    return Promise.resolve(
      this.store.find((item) => item.code === code) ?? null,
    );
  }

  findPage(params: OrderPageParams) {
    return Promise.resolve({
      items: this.store.slice(),
      total: this.store.length,
      page: params.page,
      perPage: params.perPage,
    });
  }

  seed(order: Order): void {
    this.store.push(order);
  }
}
