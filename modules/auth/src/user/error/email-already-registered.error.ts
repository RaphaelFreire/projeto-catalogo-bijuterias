import { DomainError } from "@sdd/shared";

export class EmailAlreadyRegisteredError extends DomainError {
  constructor() {
    super("user.email.already-registered", 409);
  }
}
