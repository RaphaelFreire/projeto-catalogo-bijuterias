import { UseCase } from "@sdd/shared";
import { OrderNotFoundError } from "../error";
import { OrderRepository } from "../provider";

export interface DeleteOrderIn {
  id: string;
}

export class DeleteOrder implements UseCase<DeleteOrderIn, void> {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: DeleteOrderIn): Promise<void> {
    const order = await this.orderRepository.findById(input.id);
    if (!order) {
      throw new OrderNotFoundError();
    }

    await this.orderRepository.delete(input.id);
  }
}
