import {
  Entity,
  EntityState,
  IntegerRule,
  MinValueRule,
  RequiredRule,
  UuidRule,
  Validator,
} from "@sdd/shared";

export interface StockState extends EntityState {
  productId: string;
  quantity: number;
}

export interface StockInput extends EntityState {
  productId: string;
  quantity: number;
}

export class Stock extends Entity<StockState> {
  constructor(props: StockInput) {
    super({
      ...props,
    });
  }

  get productId(): string {
    return this.props.productId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  public validate(): void {
    Validator.validate([
      {
        code: "stock.productId",
        value: this.productId,
        rules: [new RequiredRule(), new UuidRule()],
      },
      {
        code: "stock.quantity",
        value: this.quantity,
        rules: [new RequiredRule(), new IntegerRule(), new MinValueRule(0)],
      },
    ]);
  }
}
