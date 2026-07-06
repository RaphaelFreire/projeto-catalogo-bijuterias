import { UseCase } from "@sdd/shared";
import { Stock } from "../model";
import { StockAlreadyExistsError } from "../error";
import { StockRepository } from "../provider";

export interface SaveStockIn {
  id?: string;
  productId: string;
  quantity: number;
}

export class SaveStock implements UseCase<SaveStockIn, void> {
  constructor(private readonly stockRepository: StockRepository) {}

  async execute(input: SaveStockIn): Promise<void> {
    const existing = input.id
      ? await this.stockRepository.findById(input.id)
      : null;

    if (existing) {
      await this.update(existing, input);
      return;
    }

    await this.create(input);
  }

  private async update(existing: Stock, input: SaveStockIn): Promise<void> {
    const updated = existing.clone({
      quantity: input.quantity,
    });

    updated.validate();

    await this.stockRepository.update(updated);
  }

  private async create(input: SaveStockIn): Promise<void> {
    const conflicting = await this.stockRepository.findByProductId(
      input.productId,
    );
    if (conflicting) {
      throw new StockAlreadyExistsError();
    }

    const stock = new Stock({
      id: input.id,
      productId: input.productId,
      quantity: input.quantity,
    });

    stock.validate();

    await this.stockRepository.create(stock);
  }
}
