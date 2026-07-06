import { ValidationException } from "@sdd/shared";
import { Banner, BannerMaxReachedError, SaveBanner } from "../../../src/banner";
import { FakeBannerRepository } from "../../mock";

const CATEGORY_ID = "11111111-1111-4111-8111-111111111111";

function seedBanner(
  repo: FakeBannerRepository,
  overrides: Partial<{
    id: string;
    imageUrl: string;
    position: number;
    categoryId: string | null;
    linkUrl: string | null;
  }> = {},
): Banner {
  const banner = new Banner({
    id: overrides.id,
    imageUrl: overrides.imageUrl ?? "https://cdn.example.com/banner.png",
    position: overrides.position ?? 0,
    categoryId:
      overrides.categoryId ?? (overrides.linkUrl ? null : CATEGORY_ID),
    linkUrl: overrides.linkUrl ?? null,
  });
  repo.seed(banner);
  return banner;
}

describe("SaveBanner", () => {
  test("cria novo banner sem id quando há menos de 3 banners", async () => {
    const repo = new FakeBannerRepository();
    const useCase = new SaveBanner(repo);

    await useCase.execute({
      imageUrl: "https://cdn.example.com/banner.png",
      position: 0,
      categoryId: CATEGORY_ID,
    });

    expect(repo.createdBanners).toHaveLength(1);
    expect(repo.updatedBanners).toHaveLength(0);
  });

  test("falha com BannerMaxReachedError ao tentar criar um 4º banner", async () => {
    const repo = new FakeBannerRepository();
    seedBanner(repo, { position: 0 });
    seedBanner(repo, { position: 1 });
    seedBanner(repo, { position: 2 });
    const useCase = new SaveBanner(repo);

    await expect(
      useCase.execute({
        imageUrl: "https://cdn.example.com/banner4.png",
        position: 3,
        categoryId: CATEGORY_ID,
      }),
    ).rejects.toBeInstanceOf(BannerMaxReachedError);

    expect(repo.createdBanners).toEqual([]);
  });

  test("atualização não é bloqueada mesmo com 3 banners existentes", async () => {
    const repo = new FakeBannerRepository();
    const first = seedBanner(repo, { position: 0 });
    seedBanner(repo, { position: 1 });
    seedBanner(repo, { position: 2 });
    const useCase = new SaveBanner(repo);

    await useCase.execute({
      id: first.id,
      imageUrl: "https://cdn.example.com/atualizado.png",
      position: 5,
      categoryId: CATEGORY_ID,
    });

    expect(repo.updatedBanners).toHaveLength(1);
    expect(repo.updatedBanners[0].position).toBe(5);
    expect(repo.createdBanners).toEqual([]);
  });

  test("falha com ValidationException quando imageUrl é inválida", async () => {
    const repo = new FakeBannerRepository();
    const useCase = new SaveBanner(repo);

    await expect(
      useCase.execute({
        imageUrl: "not-a-url",
        position: 0,
        categoryId: CATEGORY_ID,
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdBanners).toEqual([]);
  });

  test("falha com ValidationException quando position é negativa", async () => {
    const repo = new FakeBannerRepository();
    const useCase = new SaveBanner(repo);

    await expect(
      useCase.execute({
        imageUrl: "https://cdn.example.com/banner.png",
        position: -1,
        categoryId: CATEGORY_ID,
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdBanners).toEqual([]);
  });

  test("falha com ValidationException quando categoryId é inválido", async () => {
    const repo = new FakeBannerRepository();
    const useCase = new SaveBanner(repo);

    await expect(
      useCase.execute({
        imageUrl: "https://cdn.example.com/banner.png",
        position: 0,
        categoryId: "not-a-uuid",
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdBanners).toEqual([]);
  });

  test("cria banner com linkUrl como destino, sem categoryId", async () => {
    const repo = new FakeBannerRepository();
    const useCase = new SaveBanner(repo);

    await useCase.execute({
      imageUrl: "https://cdn.example.com/banner.png",
      position: 0,
      linkUrl: "https://wa.me/5511999998888",
    });

    expect(repo.createdBanners).toHaveLength(1);
    expect(repo.createdBanners[0].linkUrl).toBe("https://wa.me/5511999998888");
    expect(repo.createdBanners[0].categoryId).toBeNull();
  });

  test("falha com ValidationException quando linkUrl não é uma URL válida", async () => {
    const repo = new FakeBannerRepository();
    const useCase = new SaveBanner(repo);

    await expect(
      useCase.execute({
        imageUrl: "https://cdn.example.com/banner.png",
        position: 0,
        linkUrl: "not-a-url",
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdBanners).toEqual([]);
  });

  test("falha com ValidationException quando não há categoryId nem linkUrl", async () => {
    const repo = new FakeBannerRepository();
    const useCase = new SaveBanner(repo);

    await expect(
      useCase.execute({
        imageUrl: "https://cdn.example.com/banner.png",
        position: 0,
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdBanners).toEqual([]);
  });

  test("falha com ValidationException quando categoryId e linkUrl são informados juntos", async () => {
    const repo = new FakeBannerRepository();
    const useCase = new SaveBanner(repo);

    await expect(
      useCase.execute({
        imageUrl: "https://cdn.example.com/banner.png",
        position: 0,
        categoryId: CATEGORY_ID,
        linkUrl: "https://wa.me/5511999998888",
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdBanners).toEqual([]);
  });

  test("cria banner com imageUrlMobile, permanecendo null quando não informada", async () => {
    const repo = new FakeBannerRepository();
    const useCase = new SaveBanner(repo);

    await useCase.execute({
      imageUrl: "https://cdn.example.com/banner-desktop.png",
      imageUrlMobile: "https://cdn.example.com/banner-mobile.png",
      position: 0,
      categoryId: CATEGORY_ID,
    });

    expect(repo.createdBanners[0].imageUrlMobile).toBe(
      "https://cdn.example.com/banner-mobile.png",
    );

    const repo2 = new FakeBannerRepository();
    const useCase2 = new SaveBanner(repo2);
    await useCase2.execute({
      imageUrl: "https://cdn.example.com/banner-desktop.png",
      position: 0,
      categoryId: CATEGORY_ID,
    });

    expect(repo2.createdBanners[0].imageUrlMobile).toBeNull();
  });

  test("falha com ValidationException quando imageUrlMobile não é uma URL válida", async () => {
    const repo = new FakeBannerRepository();
    const useCase = new SaveBanner(repo);

    await expect(
      useCase.execute({
        imageUrl: "https://cdn.example.com/banner.png",
        imageUrlMobile: "not-a-url",
        position: 0,
        categoryId: CATEGORY_ID,
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdBanners).toEqual([]);
  });

  test("atualização troca o destino de categoria para linkUrl", async () => {
    const repo = new FakeBannerRepository();
    const first = seedBanner(repo, { position: 0, categoryId: CATEGORY_ID });
    const useCase = new SaveBanner(repo);

    await useCase.execute({
      id: first.id,
      imageUrl: "https://cdn.example.com/atualizado.png",
      position: 0,
      linkUrl: "https://wa.me/5511999998888",
    });

    expect(repo.updatedBanners[0].categoryId).toBeNull();
    expect(repo.updatedBanners[0].linkUrl).toBe("https://wa.me/5511999998888");
  });
});
