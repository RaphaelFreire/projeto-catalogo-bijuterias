import { CrudRepository } from "@sdd/shared";
import { Category } from "../model";

export interface CategoryPageParams {
  page: number;
  perPage: number;
}

export interface CategoryRepository extends CrudRepository<
  Category,
  Category,
  Category,
  CategoryPageParams
> {}
