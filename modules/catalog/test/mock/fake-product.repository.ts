import {
  Product,
  ProductPageParams,
  ProductRepository,
} from "../../src/product";

export class FakeProductRepository implements ProductRepository {
  readonly createdProducts: Product[] = [];
  readonly updatedProducts: Product[] = [];
  readonly deletedIds: string[] = [];
  private store: Product[] = [];

  create(entity: Product): Promise<Product> {
    this.createdProducts.push(entity);
    this.store.push(entity);
    return Promise.resolve(entity);
  }

  update(entity: Product): Promise<Product> {
    this.updatedProducts.push(entity);
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

  findById(id: string): Promise<Product | null> {
    return Promise.resolve(this.store.find((item) => item.id === id) ?? null);
  }

  findPage(params: ProductPageParams) {
    return Promise.resolve({
      items: this.store.slice(),
      total: this.store.length,
      page: params.page,
      perPage: params.perPage,
    });
  }

  seed(product: Product): void {
    this.store.push(product);
  }
}
