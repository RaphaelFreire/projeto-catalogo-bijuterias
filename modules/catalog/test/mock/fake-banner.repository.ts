import { Banner, BannerPageParams, BannerRepository } from "../../src/banner";

export class FakeBannerRepository implements BannerRepository {
  readonly createdBanners: Banner[] = [];
  readonly updatedBanners: Banner[] = [];
  readonly deletedIds: string[] = [];
  private store: Banner[] = [];

  create(entity: Banner): Promise<Banner> {
    this.createdBanners.push(entity);
    this.store.push(entity);
    return Promise.resolve(entity);
  }

  update(entity: Banner): Promise<Banner> {
    this.updatedBanners.push(entity);
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

  findById(id: string): Promise<Banner | null> {
    return Promise.resolve(this.store.find((item) => item.id === id) ?? null);
  }

  findPage(params: BannerPageParams) {
    return Promise.resolve({
      items: this.store.slice(),
      total: this.store.length,
      page: params.page,
      perPage: params.perPage,
    });
  }

  seed(banner: Banner): void {
    this.store.push(banner);
  }
}
