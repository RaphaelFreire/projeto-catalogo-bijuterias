import { NotFoundError } from "@sdd/shared";

export class CategoryNotFoundError extends NotFoundError {
  constructor() {
    super("category.not_found");
  }
}
