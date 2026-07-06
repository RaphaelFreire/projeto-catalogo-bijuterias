import { CrudRepository } from "@sdd/shared";
import { Banner } from "../model";

export interface BannerPageParams {
  page: number;
  perPage: number;
}

export interface BannerRepository extends CrudRepository<
  Banner,
  Banner,
  Banner,
  BannerPageParams
> {}
