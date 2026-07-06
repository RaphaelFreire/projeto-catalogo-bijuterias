import { UseCase } from "@sdd/shared";
import { STORE_SETTINGS_ID, StoreSettings } from "../model";
import { StoreSettingsRepository } from "../provider";

export interface SaveStoreSettingsIn {
  whatsappNumber?: string | null;
  logoUrl?: string | null;
}

export class SaveStoreSettings implements UseCase<SaveStoreSettingsIn, void> {
  constructor(
    private readonly storeSettingsRepository: StoreSettingsRepository,
  ) {}

  async execute(input: SaveStoreSettingsIn): Promise<void> {
    const existing =
      await this.storeSettingsRepository.findById(STORE_SETTINGS_ID);

    if (existing) {
      const updated = existing.clone({
        whatsappNumber:
          input.whatsappNumber !== undefined
            ? input.whatsappNumber
            : existing.whatsappNumber,
        logoUrl: input.logoUrl !== undefined ? input.logoUrl : existing.logoUrl,
      });
      updated.validate();
      await this.storeSettingsRepository.update(updated);
      return;
    }

    const settings = new StoreSettings({
      id: STORE_SETTINGS_ID,
      whatsappNumber: input.whatsappNumber ?? null,
      logoUrl: input.logoUrl ?? null,
    });
    settings.validate();
    await this.storeSettingsRepository.create(settings);
  }
}
