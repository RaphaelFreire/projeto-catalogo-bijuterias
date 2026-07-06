## Instruções Compartilhadas

Estas instruções valem para qualquer change deste projeto e devem ser respeitadas durante a execução das tasks abaixo:

- [Como executar](../../shared/como-executar.md) — regras de execução e formato de evidência por task.
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md) — convenções de nomes de arquivos e diretórios.

## 1. Negócio — estender `store-settings` com `logoUrl`

- [x] 1.1 Estender a entidade `StoreSettings` (`modules/settings/src/store-settings/model/store-settings.entity.ts`) com o campo `logoUrl` (opcional, `null` quando ausente, validado com `UrlRule` somente quando informado), com a skill [module-entity](../../../.claude/skills/module-entity).
  > ✅ 2026-07-04 — `logoUrl?: string | null` em `StoreSettingsInput`, normalizado para `null` no construtor; `validate()` aplica `UrlRule` (a regra ignora valores vazios/nulos, validando formato só quando informado).
- [x] 1.2 Atualizar `save-store-settings.usecase.ts` para aceitar e persistir `logoUrl` opcional, preservando o valor existente quando não informado na atualização.
  > ✅ 2026-07-04 — `SaveStoreSettingsIn.logoUrl?: string | null`; na atualização, `input.logoUrl !== undefined ? input.logoUrl : existing.logoUrl` preserva o valor anterior quando o campo não é enviado.
- [x] 1.3 Atualizar os testes unitários de `save-store-settings` para cobrir `logoUrl` (ausente, informado com URL válida, formato inválido).
  > ✅ 2026-07-04 — Testes novos: criação sem `logoUrl` (fica `null`), criação com `logoUrl` válida, falha com URL inválida, atualização sem `logoUrl` preserva o valor existente. `npm run test --workspace @sdd/settings` → 9 testes passando.

## 2. Negócio — agregado `banner` (módulo catalog)

- [x] 2.1 Criar o agregado `banner` dentro do módulo `catalog` com a skill [module-aggregate](../../../.claude/skills/module-aggregate).
  > ✅ 2026-07-04 — Executado `node .claude/skills/module-aggregate/scripts/create-aggregate.js --module catalog --aggregate banner --mode crud`.
- [x] 2.2 Implementar a entidade `Banner` com a skill [module-entity](../../../.claude/skills/module-entity), com os campos `imageUrl` (required, URL válida — `UrlRule`), `position` (required, integer, min-value 0) e `categoryId` (required, uuid — referência a `category`).
  > ✅ 2026-07-04 — `banner.entity.ts` com `validate()` usando `RequiredRule`+`UrlRule` (imageUrl), `RequiredRule`+`IntegerRule`+`MinValueRule(0)` (position), `RequiredRule`+`UuidRule` (categoryId).
- [x] 2.3 Definir o contrato do repositório de `banner` com a skill [module-repository](../../../.claude/skills/module-repository), no formato `CrudRepository` padrão.
  > ✅ 2026-07-04 — `BannerRepository extends CrudRepository<Banner, Banner, Banner, BannerPageParams>` (gerado pelo scaffold, já no formato correto — sem método extra, já que o limite de 3 usa `findPage` existente).
- [x] 2.4 Implementar o caso de uso `save-banner` com a skill [module-use-case](../../../.claude/skills/module-use-case): cria/atualiza baseado em `findById`, mesmo padrão de `save-product`. No fluxo de **criação**, antes de persistir, chama `bannerRepository.findPage({ page: 1, perPage: 1 })` e, se `total >= 3`, lança `DomainError("banner.max_reached", 422)` sem criar. Atualização nunca é bloqueada por essa regra.
  > ✅ 2026-07-04 — `save-banner.usecase.ts` com constante exportada `MAX_BANNERS = 3`. Na criação, verifica `findPage({ page: 1, perPage: 1 }).total >= MAX_BANNERS` e lança `BannerMaxReachedError` (422) antes de qualquer validação/persistência. Removidos os usecases CRUD genéricos gerados pelo scaffold.
- [x] 2.5 Implementar o caso de uso `delete-banner` com a skill [module-use-case](../../../.claude/skills/module-use-case). Lançar `DomainError("banner.not_found", 404)` quando o `id` não existir.
  > ✅ 2026-07-04 — `BannerNotFoundError` em `modules/catalog/src/banner/error`; `delete-banner.usecase.ts` consulta `findById` antes de excluir.
- [x] 2.6 Cobrir os dois casos de uso com testes unitários, usando `FakeBannerRepository`. Cenários mínimos: criação sem id, criação com id, atualização, criação rejeitada ao exceder 3 banners, atualização não bloqueada pelo limite, exclusão de banner existente, exclusão de banner inexistente, validações principais (`imageUrl` inválida, `position` negativa, `categoryId` inválido).
  > ✅ 2026-07-04 — `FakeBannerRepository` em `modules/catalog/test/mock`; suíte cobre criação dentro do limite, rejeição ao exceder 3 banners, atualização não bloqueada mesmo com 3 existentes, validações (`imageUrl`, `position`, `categoryId`), exclusão de existente e inexistente. `npm run test --workspace @sdd/catalog` → 44 testes passando. `npm run build --workspace @sdd/catalog` ok.

## 3. Back-end — `settings` (logo)

- [x] 3.1 Estender o model Prisma `StoreSettings` (`apps/backend/prisma/models/settings.model.prisma`) com `logoUrl` (nullable), com a skill [backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module), gerando migration incremental.
  > ✅ 2026-07-04 — `logoUrl String?` em `settings.model.prisma`. Migration `20260704231735_settings_logo` gerada via `npx prisma migrate dev --name settings-logo` e aplicada.
- [x] 3.2 Atualizar `settings.prisma.ts` para mapear `logoUrl` no `create`/`update`/`findById`.
  > ✅ 2026-07-04 — `toRow`/`toEntity` em `settings.prisma.ts` incluem `logoUrl`.
- [x] 3.3 Criar `POST /settings/logo` (multipart, autenticado) em `settings.controller.ts`, salvando o arquivo em `apps/backend/uploads/settings/<uuid>.<ext>`, montando a URL absoluta a partir do host da requisição (mesmo padrão de `product.controller.ts`), apagando o arquivo antigo do disco se já houver uma logo configurada (falha ao apagar é logada, não bloqueia), e persistindo a nova `logoUrl` via `save-store-settings`. Retorna `{ logoUrl }`.
  > ✅ 2026-07-04 — Testado via curl com o registro já configurado: upload retorna `201` com `{ logoUrl }` absoluta; segundo upload substitui a logo e apaga o arquivo antigo do disco (confirmado com `ls`).
  > ✅ 2026-07-04 — **Correção de design descoberta após a implementação**: a primeira versão desta task herdava `whatsappNumber` como obrigatório em `SaveStoreSettings`, o que fazia o upload de logo antes de qualquer configuração prévia (registro ainda não existe) lançar `DomainError("settings.whatsappNumber.required", 422)` — um acoplamento artificial entre dois requisitos independentes. Corrigido a pedido do usuário ("separar os requisitos da melhor maneira possível"): `whatsappNumber` deixou de ser obrigatório na entidade `StoreSettings` (`RequiredRule` removida, mantendo `PhoneRule` apenas quando informado — mesmo tratamento de `logoUrl`); `save-store-settings` agora preserva cada campo independentemente quando omitido. `POST /settings/logo` agora cria o registro só com `logoUrl`, com `whatsappNumber` valendo `null`, sem exigir configuração prévia. Ver design.md (Decisão 1, "Revisão pós-implementação") e specs `settings-domain`/`settings-backend` atualizados. Testado via curl: upload de logo com registro inexistente retorna `201` normalmente. `npm run test --workspace @sdd/settings` → 10 testes passando.
- [x] 3.4 Criar `DELETE /settings/logo` (autenticado), removendo `logoUrl` (volta a `null`) e apagando o arquivo físico correspondente (falha de I/O logada, não bloqueia).
  > ✅ 2026-07-04 — Se não houver logo configurada, é um no-op (sem erro). Testado via curl: remoção retorna `204`, `GET /settings` reflete `logoUrl: null`.
- [x] 3.5 Atualizar `GET /settings` (já público) para incluir `logoUrl` na resposta.
  > ✅ 2026-07-04 — Confirmado via curl.
- [x] 3.6 Atualizar `settings.integration.http` cobrindo: upload de logo, remoção de logo, leitura refletindo `logoUrl`, upload/remoção sem JWT bloqueados (401).
  > ✅ 2026-07-04 — Cenários adicionados. `npx tsc --noEmit` no backend ok (precisou rebuildar `@sdd/settings` para o backend enxergar os tipos novos — registrado como nota operacional, não é uma task nova).

## 4. Back-end — `banner`

- [x] 4.1 Sincronizar o módulo `catalog` com o Prisma criando o model `Banner` com a skill [backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module). `categoryId` com FK para `Category` (sem cascade — excluir categoria com banners associados deve falhar, mesma decisão default já usada para `Product.categoryId`).
  > ✅ 2026-07-04 — Model `Banner` (`@@map("banners")`) em `catalog.model.prisma`, com `@relation` para `Category` sem `onDelete` (default `Restrict`). Migration `20260704232242_catalog_banner` gerada via `npx prisma migrate dev --name catalog-banner` e aplicada.
- [x] 4.2 Implementar o repositório Prisma de `banner` em `apps/backend/src/modules/catalog` com a skill [backend-prisma-repository](../../../.claude/skills/backend-prisma-repository), sem alterar a interface do domínio.
  > ✅ 2026-07-04 — `banner.prisma.ts` (`PrismaBannerRepository`), `findPage` ordenado por `position: 'asc'`.
- [x] 4.3 Criar `apps/backend/src/modules/catalog/banner.controller.ts` com a skill [backend-nest-controller](../../../.claude/skills/backend-nest-controller), expondo o CRUD completo em `/banners` (criar, atualizar, excluir, obter por id, listar — ordenado por `position`), autenticado, mesmo padrão de `CategoryController`. Endpoint de upload de imagem do banner: `POST /banners/:id/image` (multipart, autenticado), reaproveitando a mesma técnica de pasta local + URL absoluta, salvando em `apps/backend/uploads/banners/<bannerId>/<uuid>.<ext>` e persistindo `imageUrl`.
  > ✅ 2026-07-04 — CRUD completo criado. **Correção de design descoberta na implementação**: `POST /banners/:id/image` (como planejado) é inviável — `imageUrl` é obrigatória na entidade `Banner`, então o banner não pode ser criado sem uma imagem já existente, mas o endpoint original exigia um banner já existente para receber o upload (dependência circular). Substituído por um endpoint **standalone** `POST /banners/upload-image` (sem `:id`, sem checar banner existente) — só salva o arquivo em `apps/backend/uploads/banners/<uuid>.<ext>` e devolve `{ imageUrl }` absoluta. O frontend faz upload primeiro (recebe a URL) e só então cria/atualiza o banner já com `imageUrl` preenchida — mesmo endpoint serve criação e edição. `id` do banner passou a ser gerado pelo controller (`body.id ?? randomUUID()`), retornando `{ id }` em `POST /banners`, mesmo padrão de `ProductController`.
- [x] 4.4 Registrar `BannerController` e o repositório Prisma no `CatalogModule`.
  > ✅ 2026-07-04 — Adicionado à lista de `controllers`/`providers`/`exports` do `CatalogModule`. Também adicionado `GET /storefront/banners` (`@Public()`) ao `StorefrontController` já existente (não ao `BannerController`, que continua autenticado) — decisão já registrada no design.md.
  > ✅ 2026-07-05 — **Correção de design pós-implementação**: numa reorganização geral do backend por agregado (uma subpasta por domínio em cada módulo Nest), `BannerController`/`PrismaBannerRepository` moveram de `catalog/banner` para `settings/banner`, espelhando o agrupamento já existente no admin (item "Banners" na seção "Configurações" da sidebar, não em "Catálogo"). `SettingsModule` passou a exportar `PrismaBannerRepository`; `CatalogModule` importa `SettingsModule` para que `StorefrontController` continue conseguindo injetá-lo. Ver design.md (Decisão 7, "Revisão pós-implementação") e `specs/catalog-banner-backend` atualizados. Validado com `npx tsc --noEmit` e subindo o servidor numa porta isolada — `Nest application successfully started`, todas as rotas de `/banners` mapeadas normalmente.
- [x] 4.5 Criar `apps/backend/src/modules/catalog/banner.integration.http` cobrindo: CRUD completo, criação rejeitada ao exceder 3 banners (422), upload de imagem, `categoryId` inexistente, acesso sem JWT (401).
  > ✅ 2026-07-04 — Cenários criados, incluindo o upload standalone. **Testado em runtime via curl**: upload de imagem sem banner existente (201), criação de 3 banners (201 cada), 4º banner rejeitado (422 `banner.max_reached`), listagem ordenada por `position`, atualização permitida mesmo com 3 banners, exclusão (204), listagem pública `/storefront/banners` refletindo só os banners restantes, acesso sem JWT em `/banners` bloqueado (401). `npx tsc --noEmit` no backend ok.
- [x] 4.6 Adicionar `GET /storefront/banners` (`@Public()`) ao `StorefrontController` já existente (não ao `BannerController`, que continua autenticado), retornando os banners ordenados por `position` com `{ id, imageUrl, categoryId }`. Atualizar `storefront.integration.http` cobrindo: listagem pública ordenada, acesso sem JWT funciona (rota pública).
  > ✅ 2026-07-04 — Implementado junto com a task 4.4 (ver evidência lá). Cenário adicionado em `storefront.integration.http`.

## 5. Front-end — `settings` (logo)

- [x] 5.1 Estender `settings-api.util.ts` com `uploadStoreLogo`/`removeStoreLogo`, e o tipo de resposta de `getStoreSettings` com `logoUrl`.
  > ✅ 2026-07-04 — `StoreSettings.logoUrl: string | null`; `uploadStoreLogo` (multipart `FormData`) e `removeStoreLogo` adicionados.
- [x] 5.2 Estender `settings.component.tsx` com upload/preview/remoção da logo, ao lado do campo de WhatsApp.
  > ✅ 2026-07-04 — Nova seção "Logo" no formulário: miniatura com botão de remover quando configurada, botão de adicionar (abre seletor de arquivo oculto) quando não.
  > ✅ 2026-07-04 — **Correção de design**: o texto original orientava a salvar o WhatsApp antes de enviar a logo, refletindo o acoplamento revertido na task 3.3. Removido — a seção "Logo" agora só descreve onde a logo aparece ("Exibida no cabeçalho da vitrine pública."), sem pré-requisito de WhatsApp.
- [x] 5.3 Acrescentar as chaves novas de i18n necessárias (validação de `logoUrl`, mensagens de sucesso/erro do upload), reaproveitando chaves existentes.
  > ✅ 2026-07-04 — `settings.logoUrl.url` adicionada. **Nota**: `settings.whatsappNumber.required` deixou de se aplicar a este fluxo (upload de logo já não depende de `whatsappNumber` — ver correção na task 3.3). `npx tsc --noEmit` em `apps/frontend` ok.

## 6. Front-end — `banner` (admin)

- [x] 6.1 Criar `banners-api.util.ts` (`listBanners`, `getBanner`, `createBanner`, `updateBanner`, `deleteBanner`, `uploadBannerImage`).
  > ✅ 2026-07-04 — `uploadBannerImage` chama `POST /banners/upload-image` (standalone, sem `:id` — ver correção de design da task 4.3).
- [x] 6.2 Criar a listagem de `banners` no módulo `catalog`, em rota privada, ordenada por `position`. Tabela/lista com miniatura da imagem, categoria de destino, e ações (subir, descer, editar, excluir) — sem paginação (máximo de 3 itens).
  > ✅ 2026-07-04 — `banners-list.component.tsx`: tabela com miniatura, posição, e ações (subir/descer/editar/excluir). Sem paginação — busca até 4 itens de uma vez (limite real é 3).
- [x] 6.3 Criar o formulário de `banner` compartilhado entre criação e edição: select de categoria (obrigatório, populado por `/categories`) e upload de imagem. Bloquear o botão de criar novo banner quando já houver 3 cadastrados (mensagem explicando o limite).
  > ✅ 2026-07-04 — `banner-form.component.tsx`: upload de imagem via `POST /banners/upload-image` (fluxo: upload primeiro, recebe `imageUrl`, só então cria/atualiza o banner — ver correção da task 4.3), select de categoria obrigatório. Botão "Novo banner" desabilitado na listagem quando `items.length >= 3`, com mensagem explicando o limite. `position` não é editável no formulário — é atribuída automaticamente na criação (fim da lista) e preservada na edição; só muda via subir/descer (Decisão 4 do design.md).
- [x] 6.4 Integrar os botões "subir"/"descer": trocam a `position` entre o banner da linha e o vizinho (dois `PUT /banners/:id`), atualizando a lista ao concluir.
  > ✅ 2026-07-04 — `handleMove` troca as `position` via dois `updateBanner` em paralelo, depois recarrega a lista.
- [x] 6.5 Integrar a exclusão com `delete-confirmation-dialog`, mesmo padrão das demais listagens do catálogo.
  > ✅ 2026-07-04 — Mesmo padrão de categoria/produto/estoque.
- [x] 6.6 Adicionar o item "Banners" no menu lateral apontando para a listagem.
  > ✅ 2026-07-04 — Item `catalog-banners` (ícone `GalleryHorizontal`) na seção `catalog-main`, junto com produtos/categorias/estoque.
- [x] 6.7 Acrescentar as chaves novas de i18n (`banner.not_found`, `banner.max_reached`, validações de `imageUrl`/`position`/`categoryId`), reaproveitando chaves existentes.
  > ✅ 2026-07-04 — Chaves adicionadas em `messages.pt.ts`/`messages.en.ts`. `npx tsc --noEmit` em `apps/frontend` ok. Rotas `/banners`, `/banners/new` respondendo 200 no servidor de desenvolvimento.

## 7. Front-end — `storefront` (logo, banners, busca, filtro)

- [x] 7.1 Atualizar o header de `storefront.page.tsx` para exibir a logo configurada (via `GET /settings`) quando `logoUrl` estiver presente, mantendo o ícone/título atual como fallback quando não configurada.
  > ✅ 2026-07-04 — `storefront.page.tsx` busca `getStoreSettings()` (reaproveitado de `@/modules/settings/util/settings-api.util`) no mount; exibe `<img>` com a logo quando `logoUrl` existe, senão o ícone `Store` + "Loja" (fallback original).
- [x] 7.2 Criar o componente de carrossel de banners: busca `GET /storefront/banners` (público), ordenados por `position`, num contêiner de scroll horizontal com `scroll-snap` (sem setas, sem autoplay). Cada banner é um link para `/loja?categoria=<categoryId>`. Renderizado no topo da página, acima da grade de produtos. Sem banners cadastrados, o carrossel não é renderizado.
  > ✅ 2026-07-04 — `banner-carousel.component.tsx`: `listStorefrontBanners()` (nova função em `storefront-api.util.ts`), `overflow-x-auto` + `snap-x snap-mandatory`, cada banner é um `<Link>` do Next para `/loja?categoria=<categoryId>`. Retorna `null` sem banners (falha ao carregar também não quebra a página — silenciosa).
- [x] 7.3 Adicionar campo de busca por nome na vitrine, filtrando client-side (substring case-insensitive) a lista já carregada de `GET /storefront/products`.
  > ✅ 2026-07-04 — Campo de busca em `product-grid.component.tsx`, filtro via `useMemo` sobre `products` já carregado.
- [x] 7.4 Adicionar filtro por categoria (dropdown com o nome de cada categoria, buscado via `/categories`), combinando com E lógico com a busca por nome. Ler o query param `categoria` da URL no carregamento da página para pré-selecionar o filtro (usado pelo clique num banner).
  > ✅ 2026-07-04 — `listAllCategories()` (reaproveitado do módulo `catalog`) popula o dropdown; estado inicial lido de `useSearchParams().get('categoria')`; ao trocar o filtro, `router.replace` atualiza a URL sem navegação completa. **Bug real descoberto pelo `next build` de produção** (não aparece no dev mode nem no `tsc`): `useSearchParams()` precisa estar dentro de um `<Suspense>` boundary, senão o build de produção falha ao pré-renderizar `/loja` (`useSearchParams() should be wrapped in a suspense boundary`). Corrigido extraindo a lógica para um componente interno (`ProductGridContent`) envolvido por `<Suspense>` no `ProductGrid` exportado.
- [x] 7.5 Acrescentar as chaves novas de i18n necessárias (placeholder da busca, rótulo do filtro "Todas as categorias"), reaproveitando chaves existentes.
  > ✅ 2026-07-04 — Nenhuma chave de i18n nova precisou ser criada: seguindo o mesmo padrão já usado no projeto (ex.: rótulo "Esgotado" na change-007), textos estáticos de UI (placeholder, rótulo do filtro) não passam pelo sistema de i18n, que é reservado para mensagens de erro/validação vindas do backend e enums.
- [x] 7.6 Rodar `npx tsc --noEmit` em `apps/frontend` e sinalizar ao usuário que a UI está pronta para conferência manual.
  > ✅ 2026-07-04 — `npx tsc --noEmit` ok. **`npm run build` (produção) executado com sucesso** — 19 rotas geradas, incluindo `/loja` estática. Rotas `/loja`, `/loja?categoria=<id>`, `/banners`, `/settings` respondendo 200 no servidor de desenvolvimento. **UI pronta para conferência manual do usuário** — logo no header, carrossel de banners, busca e filtro de categoria na vitrine, upload de logo/banner no admin. Sem verificação automatizada de UI (decisão do design.md).

## 8. Destino do banner: adicionar `linkUrl` como alternativa à categoria

Adicionado após a implementação inicial das seções 2, 4, 6 e 7: o usuário pediu a possibilidade de o banner linkar para uma URL (não só uma categoria do catálogo). Ver design.md (Decisão 2 e Decisão 8, revisadas) e specs `catalog-banner-domain`/`catalog-banner-backend`/`catalog-banner-frontend`/`storefront-frontend` atualizadas.

- [x] 8.1 Tornar `categoryId` opcional na entidade `Banner` (`modules/catalog/src/banner/model/banner.entity.ts`), adicionar `linkUrl` (string | null, `UrlRule` quando informado) e validar, após a validação campo-a-campo, que exatamente um dos dois está preenchido (`banner.destination.required` quando nenhum, `banner.destination.exclusive` quando os dois).
  > ✅ 2026-07-04 — `UuidRule`/`UrlRule` aplicadas apenas quando os campos são informados (mesmo padrão de `whatsappNumber`/`logoUrl` em `store-settings`); checagem cross-field feita manualmente com `ValidationException`/`ValidationError` (mesmas classes usadas por `Validator.validate`, primeira vez que uma entidade do projeto lança essa checagem manualmente em vez de via array de regras — não há regra de biblioteca pronta para "exatamente um de dois campos").
- [x] 8.2 Atualizar `save-banner.usecase.ts` para aceitar `categoryId`/`linkUrl` opcionais, com troca de destino completa (não incremental) em atualização: campo omitido vira `null` explicitamente, tanto na criação quanto na atualização.
  > ✅ 2026-07-04 — `input.categoryId ?? null` / `input.linkUrl ?? null` no `update`; `create` repassa como veio (a própria entidade normaliza `undefined` para `null`). Testes cobrindo criação com `linkUrl`, `linkUrl` inválida, destino ausente, destino duplicado, e atualização trocando categoria → link.
- [x] 8.3 Atualizar testes unitários de `save-banner`/`Banner` cobrindo os novos cenários de destino.
  > ✅ 2026-07-04 — `npm run test --workspace @sdd/catalog` → 49 testes passando, 100% de cobertura em `banner.entity.ts` e `save-banner.usecase.ts`.
- [x] 8.4 Sincronizar o model Prisma `Banner` (`categoryId` passa a nullable, `linkUrl` novo campo nullable), com migration incremental.
  > ✅ 2026-07-04 — `categoryId String?`, `linkUrl String?`, relação `category Category?` (opcional). Migration `20260705010246_catalog_banner_link_url` gerada via `npx prisma migrate dev --name catalog-banner-link-url` e aplicada.
- [x] 8.5 Atualizar `banner.prisma.ts`, `banner.controller.ts` e `storefront.controller.ts` para mapear `linkUrl` em todas as operações e respostas (`{ id, imageUrl, position, categoryId, linkUrl }`).
  > ✅ 2026-07-04 — `toRow`/`toEntity` em `banner.prisma.ts`; `BannerResponse`/`StorefrontBannerResponse` incluem `linkUrl`. `npx tsc --noEmit` no backend ok.
- [x] 8.6 Atualizar `banner.integration.http` com cenários de criação com `linkUrl`, destino ausente (422 `banner.destination.required`) e destino duplicado (422 `banner.destination.exclusive`).
  > ✅ 2026-07-04 — Cenários adicionados ao final do arquivo.
- [x] 8.7 Atualizar `banner-form.component.tsx` com um seletor de tipo de destino (radio "Categoria" / "Link"), exibindo condicionalmente o select de categoria ou um campo de URL; o campo do tipo não selecionado é enviado como `null`.
  > ✅ 2026-07-04 — Estado `destinationType` inicializado a partir de `initialBanner?.linkUrl` (edição de banner existente com link já preenchido abre no modo "Link"). Botão de submit não depende mais de `categories.length` quando o destino é link.
- [x] 8.8 Atualizar `banners-list.component.tsx`/`banners-api.util.ts` (tipos `BannerSummary`/`SaveBannerPayload`) e a troca de posição (`handleMove`) para preservar `linkUrl` junto com `categoryId`.
  > ✅ 2026-07-04 — `handleMove` agora envia `categoryId` e `linkUrl` do banner original em cada chamada `PUT /banners/:id`, evitando perder o destino ao reordenar.
- [x] 8.9 Atualizar o carrossel da vitrine (`banner-carousel.component.tsx`) para abrir `linkUrl` numa nova aba quando presente, mantendo a navegação por categoria como estava.
  > ✅ 2026-07-04 — `handleBannerClick`: `window.open(banner.linkUrl, '_blank', 'noopener,noreferrer')` quando `linkUrl` existe, senão `router.push('/loja?categoria=...')` como antes.
- [x] 8.10 Acrescentar chaves de i18n novas (`banner.linkUrl.required`, `banner.linkUrl.url`, `banner.destination.required`, `banner.destination.exclusive`).
  > ✅ 2026-07-04 — Adicionadas em `messages.pt.ts`/`messages.en.ts`.
- [x] 8.11 Rodar `npx tsc --noEmit` em `apps/backend` e `apps/frontend`.
  > ✅ 2026-07-04 — Ambos limpos, sem erros novos.
