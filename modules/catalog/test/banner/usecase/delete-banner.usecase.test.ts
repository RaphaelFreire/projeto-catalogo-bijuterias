import { Banner, BannerNotFoundError, DeleteBanner } from "../../../src/banner";
import { FakeBannerRepository } from "../../mock";

describe("DeleteBanner", () => {
  test("remove banner existente do repositório", async () => {
    const repo = new FakeBannerRepository();
    const banner = new Banner({
      imageUrl: "https://cdn.example.com/banner.png",
      position: 0,
      categoryId: "11111111-1111-4111-8111-111111111111",
    });
    repo.seed(banner);
    const useCase = new DeleteBanner(repo);

    await useCase.execute({ id: banner.id });

    expect(repo.deletedIds).toEqual([banner.id]);
    await expect(repo.findById(banner.id)).resolves.toBeNull();
  });

  test("falha com BannerNotFoundError quando id não existe e não toca repositório", async () => {
    const repo = new FakeBannerRepository();
    const deleteSpy = jest.spyOn(repo, "delete");
    const useCase = new DeleteBanner(repo);

    await expect(
      useCase.execute({ id: "22222222-2222-4222-8222-222222222222" }),
    ).rejects.toBeInstanceOf(BannerNotFoundError);

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  test("BannerNotFoundError tem statusCode 404 e mensagem banner.not_found", async () => {
    const repo = new FakeBannerRepository();
    const useCase = new DeleteBanner(repo);

    await expect(
      useCase.execute({ id: "33333333-3333-4333-8333-333333333333" }),
    ).rejects.toMatchObject({
      message: "banner.not_found",
      statusCode: 404,
    });
  });
});
