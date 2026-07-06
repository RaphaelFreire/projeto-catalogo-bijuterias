import {
  Category,
  CategoryPageParams,
  CategoryRepository,
} from "../../src/category";

export class FakeCategoryRepository implements CategoryRepository {
  readonly createdCategories: Category[] = [];
  readonly updatedCategories: Category[] = [];
  readonly deletedIds: string[] = [];
  private store: Category[] = [];

  create(entity: Category): Promise<Category> {
    this.createdCategories.push(entity);
    this.store.push(entity);
    return Promise.resolve(entity);
  }

  update(entity: Category): Promise<Category> {
    this.updatedCategories.push(entity);
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

  findById(id: string): Promise<Category | null> {
    return Promise.resolve(this.store.find((item) => item.id === id) ?? null);
  }

  findPage(params: CategoryPageParams) {
    return Promise.resolve({
      items: this.store.slice(),
      total: this.store.length,
      page: params.page,
      perPage: params.perPage,
    });
  }

  seed(category: Category): void {
    this.store.push(category);
  }
}
