import { CrudRepository } from "@sdd/shared";
import { Order } from "../model";

export interface OrderPageParams {
  page: number;
  perPage: number;
}

export interface OrderRepository extends CrudRepository<
  Order,
  Order,
  Order,
  OrderPageParams
> {
  findByCode(code: string): Promise<Order | null>;
}
