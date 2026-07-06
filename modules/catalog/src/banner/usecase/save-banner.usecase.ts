import { UseCase } from "@sdd/shared";
import { Banner } from "../model";
import { BannerMaxReachedError } from "../error";
import { BannerRepository } from "../provider";

export const MAX_BANNERS = 3;

export interface SaveBannerIn {
  id?: string;
  imageUrl: string;
  imageUrlMobile?: string | null;
  position: number;
  categoryId?: string | null;
  linkUrl?: string | null;
}

export class SaveBanner implements UseCase<SaveBannerIn, void> {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async execute(input: SaveBannerIn): Promise<void> {
    const existing = input.id
      ? await this.bannerRepository.findById(input.id)
      : null;

    if (existing) {
      await this.update(existing, input);
      return;
    }

    await this.create(input);
  }

  private async update(existing: Banner, input: SaveBannerIn): Promise<void> {
    const updated = existing.clone({
      imageUrl: input.imageUrl,
      imageUrlMobile: input.imageUrlMobile ?? null,
      position: input.position,
      categoryId: input.categoryId ?? null,
      linkUrl: input.linkUrl ?? null,
    });

    updated.validate();

    await this.bannerRepository.update(updated);
  }

  private async create(input: SaveBannerIn): Promise<void> {
    const { total } = await this.bannerRepository.findPage({
      page: 1,
      perPage: 1,
    });
    if (total >= MAX_BANNERS) {
      throw new BannerMaxReachedError();
    }

    const banner = new Banner({
      id: input.id,
      imageUrl: input.imageUrl,
      imageUrlMobile: input.imageUrlMobile,
      position: input.position,
      categoryId: input.categoryId,
      linkUrl: input.linkUrl,
    });

    banner.validate();

    await this.bannerRepository.create(banner);
  }
}
