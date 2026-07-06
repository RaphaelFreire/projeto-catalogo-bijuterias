import {
  StoreSettings,
  StoreSettingsPageParams,
  StoreSettingsRepository,
} from "../../src/store-settings";

export class FakeStoreSettingsRepository implements StoreSettingsRepository {
  readonly createdSettings: StoreSettings[] = [];
  readonly updatedSettings: StoreSettings[] = [];
  readonly deletedIds: string[] = [];
  private store: StoreSettings[] = [];

  create(entity: StoreSettings): Promise<StoreSettings> {
    this.createdSettings.push(entity);
    this.store.push(entity);
    return Promise.resolve(entity);
  }

  update(entity: StoreSettings): Promise<StoreSettings> {
    this.updatedSettings.push(entity);
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

  findById(id: string): Promise<StoreSettings | null> {
    return Promise.resolve(this.store.find((item) => item.id === id) ?? null);
  }

  findPage(params: StoreSettingsPageParams) {
    return Promise.resolve({
      items: this.store.slice(),
      total: this.store.length,
      page: params.page,
      perPage: params.perPage,
    });
  }

  seed(settings: StoreSettings): void {
    this.store.push(settings);
  }
}
