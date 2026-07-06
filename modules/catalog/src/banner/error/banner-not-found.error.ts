import { NotFoundError } from "@sdd/shared";

export class BannerNotFoundError extends NotFoundError {
  constructor() {
    super("banner.not_found");
  }
}
