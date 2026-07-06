import { ValidationException } from "@sdd/shared";
import {
  SaveStoreSettings,
  STORE_SETTINGS_ID,
  StoreSettings,
} from "../../../src/store-settings";
import { FakeStoreSettingsRepository } from "../../mock";

describe("SaveStoreSettings", () => {
  test("cria o registro quando ainda não existe", async () => {
    const repo = new FakeStoreSettingsRepository();
    const useCase = new SaveStoreSettings(repo);

    await useCase.execute({ whatsappNumber: "+5511999998888" });

    expect(repo.createdSettings).toHaveLength(1);
    expect(repo.updatedSettings).toHaveLength(0);
    expect(repo.createdSettings[0].id).toBe(STORE_SETTINGS_ID);
    expect(repo.createdSettings[0].whatsappNumber).toBe("+5511999998888");
  });

  test("atualiza o registro quando já existe", async () => {
    const repo = new FakeStoreSettingsRepository();
    repo.seed(
      new StoreSettings({
        id: STORE_SETTINGS_ID,
        whatsappNumber: "+5511999998888",
      }),
    );
    const useCase = new SaveStoreSettings(repo);

    await useCase.execute({ whatsappNumber: "+5511888887777" });

    expect(repo.updatedSettings).toHaveLength(1);
    expect(repo.createdSettings).toHaveLength(0);
    expect(repo.updatedSettings[0].id).toBe(STORE_SETTINGS_ID);
    expect(repo.updatedSettings[0].whatsappNumber).toBe("+5511888887777");
  });

  test("cria o registro sem whatsappNumber, permanecendo null (requisitos independentes)", async () => {
    const repo = new FakeStoreSettingsRepository();
    const useCase = new SaveStoreSettings(repo);

    await useCase.execute({ logoUrl: "https://cdn.example.com/logo.png" });

    expect(repo.createdSettings).toHaveLength(1);
    expect(repo.createdSettings[0].whatsappNumber).toBeNull();
    expect(repo.createdSettings[0].logoUrl).toBe(
      "https://cdn.example.com/logo.png",
    );
  });

  test("atualização sem whatsappNumber preserva o valor existente", async () => {
    const repo = new FakeStoreSettingsRepository();
    repo.seed(
      new StoreSettings({
        id: STORE_SETTINGS_ID,
        whatsappNumber: "+5511999998888",
      }),
    );
    const useCase = new SaveStoreSettings(repo);

    await useCase.execute({ logoUrl: "https://cdn.example.com/logo.png" });

    expect(repo.updatedSettings[0].whatsappNumber).toBe("+5511999998888");
    expect(repo.updatedSettings[0].logoUrl).toBe(
      "https://cdn.example.com/logo.png",
    );
  });

  test("falha com ValidationException quando whatsappNumber não está em E.164", async () => {
    const repo = new FakeStoreSettingsRepository();
    const useCase = new SaveStoreSettings(repo);

    await expect(
      useCase.execute({ whatsappNumber: "11999998888" }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdSettings).toEqual([]);
  });

  test("cria o registro sem logoUrl, permanecendo null", async () => {
    const repo = new FakeStoreSettingsRepository();
    const useCase = new SaveStoreSettings(repo);

    await useCase.execute({ whatsappNumber: "+5511999998888" });

    expect(repo.createdSettings[0].logoUrl).toBeNull();
  });

  test("cria o registro com logoUrl válida", async () => {
    const repo = new FakeStoreSettingsRepository();
    const useCase = new SaveStoreSettings(repo);

    await useCase.execute({
      whatsappNumber: "+5511999998888",
      logoUrl: "https://cdn.example.com/logo.png",
    });

    expect(repo.createdSettings[0].logoUrl).toBe(
      "https://cdn.example.com/logo.png",
    );
  });

  test("falha com ValidationException quando logoUrl não é uma URL válida", async () => {
    const repo = new FakeStoreSettingsRepository();
    const useCase = new SaveStoreSettings(repo);

    await expect(
      useCase.execute({
        whatsappNumber: "+5511999998888",
        logoUrl: "not-a-url",
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdSettings).toEqual([]);
  });

  test("atualização sem logoUrl preserva o valor existente", async () => {
    const repo = new FakeStoreSettingsRepository();
    repo.seed(
      new StoreSettings({
        id: STORE_SETTINGS_ID,
        whatsappNumber: "+5511999998888",
        logoUrl: "https://cdn.example.com/logo.png",
      }),
    );
    const useCase = new SaveStoreSettings(repo);

    await useCase.execute({ whatsappNumber: "+5511888887777" });

    expect(repo.updatedSettings[0].logoUrl).toBe(
      "https://cdn.example.com/logo.png",
    );
  });
});
