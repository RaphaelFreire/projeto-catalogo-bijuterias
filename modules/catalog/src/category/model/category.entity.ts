import {
  Entity,
  EntityState,
  MaxLengthRule,
  MinLengthRule,
  RequiredRule,
  Validator,
} from "@sdd/shared";

export interface CategoryState extends EntityState {
  name: string;
}

export interface CategoryInput extends EntityState {
  name: string;
}

export class Category extends Entity<CategoryState> {
  constructor(props: CategoryInput) {
    super({
      ...props,
    });
  }

  get name(): string {
    return this.props.name;
  }

  public validate(): void {
    Validator.validate([
      {
        code: "category.name",
        value: this.name,
        rules: [
          new RequiredRule(),
          new MinLengthRule(2),
          new MaxLengthRule(120),
        ],
      },
    ]);
  }
}
