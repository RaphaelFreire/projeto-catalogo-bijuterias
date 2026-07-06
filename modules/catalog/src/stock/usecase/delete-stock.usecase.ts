import { UseCase } from "@sdd/shared";
import { StockNotFoundError } from "../error";
import { StockRepository } from "../provider";

export interface DeleteStockIn {
  id: string;
}

export class DeleteStock implements UseCase<DeleteStockIn, void> {
  constructor(private readonly stockRepository: StockRepository) {}

  async execute(input: DeleteStockIn): Promise<void> {
    const stock = await this.stockRepository.findById(input.id);
    if (!stock) {
      throw new StockNotFoundError();
    }

    await this.stockRepository.delete(input.id);
  }
}
