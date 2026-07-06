import { UseCase } from "@sdd/shared";
import { CategoryNotFoundError } from "../error";
import { CategoryRepository } from "../provider";

export interface DeleteCategoryIn {
  id: string;
}

export class DeleteCategory implements UseCase<DeleteCategoryIn, void> {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: DeleteCategoryIn): Promise<void> {
    const category = await this.categoryRepository.findById(input.id);
    if (!category) {
      throw new CategoryNotFoundError();
    }

    await this.categoryRepository.delete(input.id);
  }
}
