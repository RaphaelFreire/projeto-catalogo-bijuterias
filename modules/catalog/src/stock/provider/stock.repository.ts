import { CrudRepository } from "@sdd/shared";
import { Stock } from "../model";

export interface StockPageParams {
  page: number;
  perPage: number;
}

export interface StockRepository extends CrudRepository<
  Stock,
  Stock,
  Stock,
  StockPageParams
> {
  findByProductId(productId: string): Promise<Stock | null>;

  /**
   * Desconta `quantity` do estoque de `productId` de forma atômica: a implementação técnica
   * SHALL ser uma única operação condicional no nível do banco (ex.: `UPDATE ... WHERE quantity >= X`),
   * nunca ler-depois-escrever, para evitar corrida entre checkouts concorrentes.
   * Retorna `true` se havia estoque suficiente e o desconto foi aplicado, `false` caso contrário.
   */
  decrementIfAvailable(productId: string, quantity: number): Promise<boolean>;
}
