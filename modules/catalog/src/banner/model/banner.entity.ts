import {
  Entity,
  EntityState,
  IntegerRule,
  MinValueRule,
  RequiredRule,
  UrlRule,
  UuidRule,
  Validator,
  ValidationError,
  ValidationException,
} from "@sdd/shared";

export interface BannerState extends EntityState {
  imageUrl: string;
  imageUrlMobile: string | null;
  position: number;
  categoryId: string | null;
  linkUrl: string | null;
}

export interface BannerInput extends EntityState {
  imageUrl: string;
  imageUrlMobile?: string | null;
  position: number;
  categoryId?: string | null;
  linkUrl?: string | null;
}

export class Banner extends Entity<BannerState> {
  constructor(props: BannerInput) {
    super({
      ...props,
      imageUrlMobile: props.imageUrlMobile ?? null,
      categoryId: props.categoryId ?? null,
      linkUrl: props.linkUrl ?? null,
    });
  }

  get imageUrl(): string {
    return this.props.imageUrl;
  }

  get imageUrlMobile(): string | null {
    return this.props.imageUrlMobile;
  }

  get position(): number {
    return this.props.position;
  }

  get categoryId(): string | null {
    return this.props.categoryId;
  }

  get linkUrl(): string | null {
    return this.props.linkUrl;
  }

  public validate(): void {
    Validator.validate([
      {
        code: "banner.imageUrl",
        value: this.imageUrl,
        rules: [new RequiredRule(), new UrlRule()],
      },
      {
        code: "banner.imageUrlMobile",
        value: this.imageUrlMobile,
        rules: [new UrlRule()],
      },
      {
        code: "banner.position",
        value: this.position,
        rules: [new RequiredRule(), new IntegerRule(), new MinValueRule(0)],
      },
      {
        code: "banner.categoryId",
        value: this.categoryId,
        rules: [new UuidRule()],
      },
      {
        code: "banner.linkUrl",
        value: this.linkUrl,
        rules: [new UrlRule()],
      },
    ]);

    if (!this.categoryId && !this.linkUrl) {
      throw new ValidationException([
        new ValidationError("banner.destination.required"),
      ]);
    }

    if (this.categoryId && this.linkUrl) {
      throw new ValidationException([
        new ValidationError("banner.destination.exclusive"),
      ]);
    }
  }
}
