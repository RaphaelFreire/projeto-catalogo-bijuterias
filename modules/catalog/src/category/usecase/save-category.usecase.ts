import { UseCase } from "@sdd/shared";
import { Category } from "../model";
import { CategoryRepository } from "../provider";

export interface SaveCategoryIn {
  id?: string;
  name: string;
}

export class SaveCategory implements UseCase<SaveCategoryIn, void> {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: SaveCategoryIn): Promise<void> {
    const existing = input.id
      ? await this.categoryRepository.findById(input.id)
      : null;

    if (existing) {
      await this.update(existing, input);
      return;
    }

    await this.create(input);
  }

  private async update(
    existing: Category,
    input: SaveCategoryIn,
  ): Promise<void> {
    const updated = existing.clone({
      name: input.name,
    });

    updated.validate();

    await this.categoryRepository.update(updated);
  }

  private async create(input: SaveCategoryIn): Promise<void> {
    const category = new Category({
      id: input.id,
      name: input.name,
    });

    category.validate();

    await this.categoryRepository.create(category);
  }
}
