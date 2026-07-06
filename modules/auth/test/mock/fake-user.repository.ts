import { User, UserPageParams, UserRepository } from "../../src/user";

export class FakeUserRepository implements UserRepository {
  readonly createdUsers: User[] = [];
  readonly updatedUsers: User[] = [];
  readonly deletedIds: string[] = [];
  private store: User[] = [];

  create(entity: User): Promise<User> {
    this.createdUsers.push(entity);
    this.store.push(entity);
    return Promise.resolve(entity);
  }

  update(entity: User): Promise<User> {
    this.updatedUsers.push(entity);
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

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.store.find((item) => item.id === id) ?? null);
  }

  findPage(params: UserPageParams) {
    return Promise.resolve({
      items: this.store.slice(),
      total: this.store.length,
      page: params.page,
      perPage: params.perPage,
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(
      this.store.find((item) => item.email === email) ?? null,
    );
  }

  seed(user: User): void {
    this.store.push(user);
  }
}
