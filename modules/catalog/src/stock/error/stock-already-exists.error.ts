import { DomainError } from "@sdd/shared";

export class StockAlreadyExistsError extends DomainError {
  constructor() {
    super("stock.product.already_exists", 409);
  }
}
