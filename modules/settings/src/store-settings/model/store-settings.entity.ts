import {
  Entity,
  EntityState,
  PhoneRule,
  UrlRule,
  Validator,
} from "@sdd/shared";

/** Id fixo do único registro de configuração da loja. Nunca é informado pelo chamador. */
export const STORE_SETTINGS_ID = "00000000-0000-4000-8000-000000000000";

export interface StoreSettingsState extends EntityState {
  whatsappNumber: string | null;
  logoUrl: string | null;
}

export interface StoreSettingsInput extends EntityState {
  whatsappNumber?: string | null;
  logoUrl?: string | null;
}

export class StoreSettings extends Entity<StoreSettingsState> {
  constructor(props: StoreSettingsInput) {
    super({
      ...props,
      whatsappNumber: props.whatsappNumber ?? null,
      logoUrl: props.logoUrl ?? null,
    });
  }

  get whatsappNumber(): string | null {
    return this.props.whatsappNumber;
  }

  get logoUrl(): string | null {
    return this.props.logoUrl;
  }

  public validate(): void {
    Validator.validate([
      {
        code: "settings.whatsappNumber",
        value: this.whatsappNumber,
        rules: [new PhoneRule()],
      },
      {
        code: "settings.logoUrl",
        value: this.logoUrl,
        rules: [new UrlRule()],
      },
    ]);
  }
}
