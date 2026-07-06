import { NotFoundError } from "@sdd/shared";

export class ProductNotFoundError extends NotFoundError {
  constructor() {
    super("product.not_found");
  }
}
