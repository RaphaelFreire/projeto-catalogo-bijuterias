import {
  Entity,
  EntityState,
  IntegerRule,
  MinItemsRule,
  MinLengthRule,
  MinValueRule,
  RegexRule,
  RequiredRule,
  UuidRule,
  ValidationError,
  ValidationException,
  Validator,
} from "@sdd/shared";

const CODE_REGEX = /^[A-Z0-9]{8}$/;

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderState extends EntityState {
  code: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  paymentConfirmed: boolean;
}

export interface OrderInput extends EntityState {
  code: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  paymentConfirmed?: boolean;
}

export class Order extends Entity<OrderState> {
  constructor(props: OrderInput) {
    super({
      ...props,
      paymentConfirmed: props.paymentConfirmed ?? false,
    });
  }

  get code(): string {
    return this.props.code;
  }

  get customerName(): string {
    return this.props.customerName;
  }

  get items(): OrderItem[] {
    return this.props.items;
  }

  get total(): number {
    return this.props.total;
  }

  get paymentConfirmed(): boolean {
    return this.props.paymentConfirmed;
  }

  public validate(): void {
    Validator.validate([
      {
        code: "order.code",
        value: this.code,
        rules: [new RequiredRule(), new RegexRule(CODE_REGEX)],
      },
      {
        code: "order.customerName",
        value: this.customerName,
        rules: [new RequiredRule(), new MinLengthRule(2)],
      },
      {
        code: "order.items",
        value: this.items,
        rules: [new RequiredRule(), new MinItemsRule(1)],
      },
      {
        code: "order.total",
        value: this.total,
        rules: [new RequiredRule(), new MinValueRule(0)],
      },
    ]);

    this.validateItems();
  }

  private validateItems(): void {
    const errors: ValidationError[] = [];
    const productIdRules = [new RequiredRule(), new UuidRule()];
    const nameRules = [new RequiredRule()];
    const priceRules = [new RequiredRule(), new MinValueRule(0)];
    const quantityRules = [
      new RequiredRule(),
      new IntegerRule(),
      new MinValueRule(1),
    ];

    for (const item of this.items) {
      for (const rule of productIdRules) {
        this.pushError(
          errors,
          "order.items.productId",
          rule.validate(item.productId),
        );
      }
      for (const rule of nameRules) {
        this.pushError(errors, "order.items.name", rule.validate(item.name));
      }
      for (const rule of priceRules) {
        this.pushError(errors, "order.items.price", rule.validate(item.price));
      }
      for (const rule of quantityRules) {
        this.pushError(
          errors,
          "order.items.quantity",
          rule.validate(item.quantity),
        );
      }
    }

    if (errors.length > 0) {
      throw new ValidationException(errors);
    }
  }

  private pushError(
    errors: ValidationError[],
    code: string,
    errorCode: string | null,
  ): void {
    if (errorCode !== null) {
      errors.push(new ValidationError(`${code}.${errorCode}`));
    }
  }
}
