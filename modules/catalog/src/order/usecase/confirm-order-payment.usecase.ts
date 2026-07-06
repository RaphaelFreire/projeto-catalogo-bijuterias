import { UseCase } from "@sdd/shared";
import { OrderNotFoundError } from "../error";
import { OrderRepository } from "../provider";

export interface ConfirmOrderPaymentIn {
  id: string;
}

export class ConfirmOrderPayment implements UseCase<
  ConfirmOrderPaymentIn,
  void
> {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: ConfirmOrderPaymentIn): Promise<void> {
    const order = await this.orderRepository.findById(input.id);
    if (!order) {
      throw new OrderNotFoundError();
    }

    const updated = order.clone({ paymentConfirmed: true });
    updated.validate();

    await this.orderRepository.update(updated);
  }
}
