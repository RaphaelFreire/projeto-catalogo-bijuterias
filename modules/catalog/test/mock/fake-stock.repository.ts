import { Stock, StockPageParams, StockRepository } from "../../src/stock";

export class FakeStockRepository implements StockRepository {
  readonly createdStocks: Stock[] = [];
  readonly updatedStocks: Stock[] = [];
  readonly deletedIds: string[] = [];
  private store: Stock[] = [];

  create(entity: Stock): Promise<Stock> {
    this.createdStocks.push(entity);
    this.store.push(entity);
    return Promise.resolve(entity);
  }

  update(entity: Stock): Promise<Stock> {
    this.updatedStocks.push(entity);
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

  findById(id: string): Promise<Stock | null> {
    return Promise.resolve(this.store.find((item) => item.id === id) ?? null);
  }

  findByProductId(productId: string): Promise<Stock | null> {
    return Promise.resolve(
      this.store.find((item) => item.productId === productId) ?? null,
    );
  }

  findPage(params: StockPageParams) {
    return Promise.resolve({
      items: this.store.slice(),
      total: this.store.length,
      page: params.page,
      perPage: params.perPage,
    });
  }

  decrementIfAvailable(productId: string, quantity: number): Promise<boolean> {
    const stock = this.store.find((item) => item.productId === productId);
    if (!stock || stock.quantity < quantity) {
      return Promise.resolve(false);
    }
    const index = this.store.indexOf(stock);
    this.store[index] = stock.clone({ quantity: stock.quantity - quantity });
    return Promise.resolve(true);
  }

  seed(stock: Stock): void {
    this.store.push(stock);
  }
}
