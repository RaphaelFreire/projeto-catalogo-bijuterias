import { NotFoundError } from "@sdd/shared";

export class UserNotFoundError extends NotFoundError {
  constructor() {
    super("user.not-found");
  }
}
