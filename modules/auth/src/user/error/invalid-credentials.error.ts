import { DomainError } from "@sdd/shared";

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super("user.credentials.invalid", 401);
  }
}
