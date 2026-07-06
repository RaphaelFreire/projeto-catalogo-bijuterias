import { UseCase } from "@sdd/shared";
import { Product, ProductStatus } from "../model";
import { ProductRepository } from "../provider";

export interface SaveProductIn {
  id?: string;
  name: string;
  description?: string | null;
  price: number;
  status: ProductStatus;
  bestSeller?: boolean;
  dailyDeal?: boolean;
  lastUnits?: boolean;
  categoryId?: string | null;
  images?: string[];
}

export class SaveProduct implements UseCase<SaveProductIn, void> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: SaveProductIn): Promise<void> {
    const existing = input.id
      ? await this.productRepository.findById(input.id)
      : null;

    if (existing) {
      await this.update(existing, input);
      return;
    }

    await this.create(input);
  }

  private async update(existing: Product, input: SaveProductIn): Promise<void> {
    const updated = existing.clone({
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      status: input.status,
      bestSeller: input.bestSeller ?? existing.bestSeller,
      dailyDeal: input.dailyDeal ?? existing.dailyDeal,
      lastUnits: input.lastUnits ?? existing.lastUnits,
      categoryId:
        input.categoryId !== undefined ? input.categoryId : existing.categoryId,
      images: input.images ?? existing.images,
    });

    updated.validate();

    await this.productRepository.update(updated);
  }

  private async create(input: SaveProductIn): Promise<void> {
    const product = new Product({
      id: input.id,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      status: input.status,
      bestSeller: input.bestSeller ?? false,
      dailyDeal: input.dailyDeal ?? false,
      lastUnits: input.lastUnits ?? false,
      categoryId: input.categoryId ?? null,
      images: input.images ?? [],
    });

    product.validate();

    await this.productRepository.create(product);
  }
}
