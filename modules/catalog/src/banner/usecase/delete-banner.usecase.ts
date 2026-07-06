import { UseCase } from "@sdd/shared";
import { BannerNotFoundError } from "../error";
import { BannerRepository } from "../provider";

export interface DeleteBannerIn {
  id: string;
}

export class DeleteBanner implements UseCase<DeleteBannerIn, void> {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async execute(input: DeleteBannerIn): Promise<void> {
    const banner = await this.bannerRepository.findById(input.id);
    if (!banner) {
      throw new BannerNotFoundError();
    }

    await this.bannerRepository.delete(input.id);
  }
}
