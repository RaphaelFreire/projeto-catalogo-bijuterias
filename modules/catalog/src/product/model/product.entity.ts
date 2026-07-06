import {
  Entity,
  EntityState,
  InRule,
  MaxItemsRule,
  MaxLengthRule,
  MinLengthRule,
  MinValueRule,
  PrecisionRule,
  RequiredRule,
  UrlRule,
  UuidRule,
  Validator,
} from "@sdd/shared";

export type ProductStatus = "active" | "inactive" | "draft";

export const PRODUCT_STATUS_VALUES: readonly ProductStatus[] = [
  "active",
  "inactive",
  "draft",
];

export const PRODUCT_IMAGES_MAX_ITEMS = 8;

export interface ProductState extends EntityState {
  name: string;
  description: string | null;
  price: number;
  status: ProductStatus;
  bestSeller: boolean;
  dailyDeal: boolean;
  lastUnits: boolean;
  categoryId: string | null;
  images: string[];
}

export interface ProductInput extends EntityState {
  name: string;
  description?: string | null;
  price: number;
  status: ProductStatus;
  bestSeller?: boolean;
  dailyDeal?: boolean;
  lastUnits?: boolean;
  categoryId?: string | null;
  images?: string[];
}

export class Product extends Entity<ProductState> {
  constructor(props: ProductInput) {
    super({
      ...props,
      description: props.description ?? null,
      bestSeller: props.bestSeller ?? false,
      dailyDeal: props.dailyDeal ?? false,
      lastUnits: props.lastUnits ?? false,
      categoryId: props.categoryId ?? null,
      images: props.images ?? [],
    });
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get price(): number {
    return this.props.price;
  }

  get status(): ProductStatus {
    return this.props.status;
  }

  get bestSeller(): boolean {
    return this.props.bestSeller;
  }

  get dailyDeal(): boolean {
    return this.props.dailyDeal;
  }

  get lastUnits(): boolean {
    return this.props.lastUnits;
  }

  get categoryId(): string | null {
    return this.props.categoryId;
  }

  get images(): string[] {
    return this.props.images;
  }

  public validate(): void {
    Validator.validate([
      {
        code: "product.name",
        value: this.name,
        rules: [
          new RequiredRule(),
          new MinLengthRule(2),
          new MaxLengthRule(120),
        ],
      },
      {
        code: "product.description",
        value: this.description,
        rules: [new MaxLengthRule(500)],
      },
      {
        code: "product.price",
        value: this.price,
        rules: [new RequiredRule(), new MinValueRule(0), new PrecisionRule(2)],
      },
      {
        code: "product.status",
        value: this.status,
        rules: [new RequiredRule(), new InRule(PRODUCT_STATUS_VALUES)],
      },
      {
        code: "product.categoryId",
        value: this.categoryId,
        rules: [new UuidRule()],
      },
      {
        code: "product.images",
        value: this.images,
        rules: [new MaxItemsRule(PRODUCT_IMAGES_MAX_ITEMS), new UrlRule()],
      },
    ]);
  }
}
