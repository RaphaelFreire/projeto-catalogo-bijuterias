import { DomainError, UseCase } from "@sdd/shared";
import { Order, OrderItem } from "../model";
import { OrderRepository } from "../provider";

const CODE_LENGTH = 8;
const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const MAX_CODE_ATTEMPTS = 5;

export interface CreateOrderIn {
  customerName: string;
  items: OrderItem[];
}

export class CreateOrder implements UseCase<CreateOrderIn, string> {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: CreateOrderIn): Promise<string> {
    const total = input.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const code = await this.generateUniqueCode();

    const order = new Order({
      code,
      customerName: input.customerName,
      items: input.items,
      total,
    });

    order.validate();

    await this.orderRepository.create(order);

    return order.code;
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = generateCode();
      const existing = await this.orderRepository.findByCode(code);
      if (!existing) {
        return code;
      }
    }

    throw new DomainError("order.code.generation_failed", 500);
  }
}

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}
