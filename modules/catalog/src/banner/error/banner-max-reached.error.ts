import { DomainError } from "@sdd/shared";

export class BannerMaxReachedError extends DomainError {
  constructor() {
    super("banner.max_reached", 422);
  }
}
