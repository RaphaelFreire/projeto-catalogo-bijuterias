import { CrudRepository } from "@sdd/shared";
import { StoreSettings } from "../model";

export interface StoreSettingsPageParams {
  page: number;
  perPage: number;
}

export interface StoreSettingsRepository extends CrudRepository<
  StoreSettings,
  StoreSettings,
  StoreSettings,
  StoreSettingsPageParams
> {}
