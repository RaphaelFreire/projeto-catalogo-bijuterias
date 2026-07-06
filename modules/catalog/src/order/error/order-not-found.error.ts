import { NotFoundError } from "@sdd/shared";

export class OrderNotFoundError extends NotFoundError {
  constructor() {
    super("order.not_found");
  }
}
