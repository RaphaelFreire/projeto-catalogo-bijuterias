import { UseCase } from "@sdd/shared";
import { ProductNotFoundError } from "../error";
import { ProductRepository } from "../provider";

export interface DeleteProductIn {
  id: string;
}

export class DeleteProduct implements UseCase<DeleteProductIn, void> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: DeleteProductIn): Promise<void> {
    const product = await this.productRepository.findById(input.id);
    if (!product) {
      throw new ProductNotFoundError();
    }

    await this.productRepository.delete(input.id);
  }
}
