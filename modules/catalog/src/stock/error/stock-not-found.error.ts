import { NotFoundError } from "@sdd/shared";

export class StockNotFoundError extends NotFoundError {
  constructor() {
    super("stock.not_found");
  }
}
