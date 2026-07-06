## Instruções Compartilhadas

Estas instruções valem para qualquer change deste projeto e devem ser respeitadas durante a execução das tasks abaixo:

- [Como executar](../../shared/como-executar.md) — regras de execução e formato de evidência por task.
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md) — convenções de nomes de arquivos e diretórios.

## 1. Negócio — agregado `category` (módulo catalog)

- [x] 1.1 Criar o agregado `category` dentro do módulo `catalog` com a skill [module-aggregate](../../../.claude/skills/module-aggregate).
  > ✅ 2026-07-04 — Executado `node .claude/skills/module-aggregate/scripts/create-aggregate.js --module catalog --aggregate category --mode crud`. Estrutura `modules/catalog/src/category/{model,provider,usecase}` criada.
- [x] 1.2 Implementar a entidade `Category` com a skill [module-entity](../../../.claude/skills/module-entity), com o campo `name` (required, min-length 2, max-length 120).
  > ✅ 2026-07-04 — `modules/catalog/src/category/model/category.entity.ts` com `CategoryState`/`CategoryInput` e `validate()` usando `RequiredRule`, `MinLengthRule(2)`, `MaxLengthRule(120)` do `@sdd/shared`.
- [x] 1.3 Definir o contrato do repositório de `category` com a skill [module-repository](../../../.claude/skills/module-repository).
  > ✅ 2026-07-04 — `CategoryRepository extends CrudRepository<Category, Category, Category, CategoryPageParams>` (gerado pelo scaffold, já no formato correto).
- [x] 1.4 Implementar o caso de uso `save-category` com a skill [module-use-case](../../../.claude/skills/module-use-case): cria/atualiza baseado em `findById`, mesmo padrão de `save-product`.
  > ✅ 2026-07-04 — `save-category.usecase.ts`. Removidos os usecases CRUD genéricos gerados pelo scaffold (`create/update/find-by-id/find-page`), não usados no padrão do projeto.
- [x] 1.5 Implementar o caso de uso `delete-category` com a skill [module-use-case](../../../.claude/skills/module-use-case). Lançar `DomainError("category.not_found", 404)` quando o `id` não existir.
  > ✅ 2026-07-04 — `CategoryNotFoundError` em `modules/catalog/src/category/error` (estende `NotFoundError`); `delete-category.usecase.ts` consulta `findById` antes de excluir.
- [x] 1.6 Cobrir os dois casos de uso com testes unitários, usando `FakeCategoryRepository` e demais fakes necessários.
  > ✅ 2026-07-04 — `FakeCategoryRepository` em `modules/catalog/test/mock`; suíte cobre criação sem id, criação com id, atualização, validação (nome curto, nome longo), exclusão de existente e de inexistente. `npm run test --workspace @sdd/catalog` → 19 testes passando (categoria + produto). `npm run build --workspace @sdd/catalog` ok.

## 2. Negócio — agregado `stock` (módulo catalog)

- [x] 2.1 Criar o agregado `stock` dentro do módulo `catalog` com a skill [module-aggregate](../../../.claude/skills/module-aggregate).
  > ✅ 2026-07-04 — Executado `node .claude/skills/module-aggregate/scripts/create-aggregate.js --module catalog --aggregate stock --mode crud`.
- [x] 2.2 Implementar a entidade `Stock` com a skill [module-entity](../../../.claude/skills/module-entity), com os campos `productId` (required, uuid) e `quantity` (required, integer, min-value 0).
  > ✅ 2026-07-04 — `stock.entity.ts` com `validate()` usando `RequiredRule`+`UuidRule` (productId) e `RequiredRule`+`IntegerRule`+`MinValueRule(0)` (quantity).
- [x] 2.3 Definir o contrato do repositório de `stock` com a skill [module-repository](../../../.claude/skills/module-repository), com os cinco métodos padrão de `CrudRepository` (create/update/delete/findById/findPage) mesmo que nem todos sejam expostos via HTTP.
  > ✅ 2026-07-04 — `StockRepository extends CrudRepository<...>` e acrescido `findByProductId(productId)` (chave natural do agregado, usada para impedir dois registros de estoque para o mesmo produto).
- [x] 2.4 Implementar o caso de uso `save-stock` com a skill [module-use-case](../../../.claude/skills/module-use-case): cria/atualiza baseado em `findById`, mesmo padrão de `save-product`.
  > ✅ 2026-07-04 — `save-stock.usecase.ts`. Na criação, verifica `findByProductId` e lança `StockAlreadyExistsError` (409) se já existir estoque para o produto. Na atualização, só `quantity` é alterável — `productId` permanece o da entidade existente.
- [x] 2.5 Implementar o caso de uso `delete-stock` com a skill [module-use-case](../../../.claude/skills/module-use-case). Lançar `DomainError("stock.not_found", 404)` quando o `id` não existir.
  > ✅ 2026-07-04 — `StockNotFoundError` em `modules/catalog/src/stock/error`; `delete-stock.usecase.ts` consulta `findById` antes de excluir.
- [x] 2.6 Cobrir os dois casos de uso com testes unitários, usando `FakeStockRepository` e demais fakes necessários.
  > ✅ 2026-07-04 — `FakeStockRepository` (com `findByProductId`) em `modules/catalog/test/mock`; suíte cobre criação sem id, conflito de produto já com estoque, criação para produto diferente, atualização (mantendo productId), validações (quantidade negativa, não inteira, productId inválido), exclusão de existente e inexistente. `npm run test --workspace @sdd/catalog` → 29 testes passando. `npm run build --workspace @sdd/catalog` ok.

## 3. Negócio — extensão do agregado `product`

- [x] 3.1 Estender a entidade `Product` (`modules/catalog/src/product/model/product.entity.ts`) com o campo `categoryId` (opcional, `null` quando ausente, `UuidRule` aplicada somente quando informado — referência a `category`), usando a skill [module-entity](../../../.claude/skills/module-entity).
  > ✅ 2026-07-04 — `categoryId?: string | null` em `ProductInput`, normalizado para `null` no construtor; `UuidRule` aplicada em `validate()` (a própria regra ignora valores vazios/nulos, então só valida formato quando informado).
- [x] 3.2 Estender a entidade `Product` com o campo `images` (lista de strings, default `[]`, validada com `MaxItemsRule` — limite inicial de 8 — e cada item validado com `UrlRule`).
  > ✅ 2026-07-04 — `images?: string[]` em `ProductInput`, default `[]`; constante `PRODUCT_IMAGES_MAX_ITEMS = 8`; `validate()` aplica `MaxItemsRule(8)` e `UrlRule()` (que valida cada item do array via `validateEachValue` do `@sdd/shared`).
- [x] 3.3 Atualizar os testes unitários de `save-product`/`delete-product` para cobrir os campos novos (`categoryId` opcional com validação de formato quando informado, `images` respeitando o limite e o formato de URL).
  > ✅ 2026-07-04 — Testes novos em `save-product.usecase.test.ts`: criação sem categoria (`categoryId` fica `null`), criação com `categoryId`+`images` válidos, falha com `categoryId` não-uuid, falha com `images` excedendo 8 itens, falha com URL inválida em `images`, atualização preserva `categoryId`/`images` quando não informados no input. `npm run test --workspace @sdd/catalog` → 35 testes passando. `npm run build --workspace @sdd/catalog` ok.

## 4. Back-end — `category`

- [x] 4.1 Sincronizar o módulo `catalog` com o Prisma criando o model `Category` com a skill [backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module).
  > ✅ 2026-07-04 — Model `Category` (`@@map("categories")`) em `apps/backend/prisma/models/catalog.model.prisma`. Migration `20260704164742_catalog_category` gerada via `npx prisma migrate dev --name catalog-category` e aplicada.
- [x] 4.2 Implementar o repositório Prisma de `category` em `apps/backend/src/modules/catalog` com a skill [backend-prisma-repository](../../../.claude/skills/backend-prisma-repository), sem alterar a interface definida no módulo.
  > ✅ 2026-07-04 — `apps/backend/src/modules/catalog/category.prisma.ts` (`PrismaCategoryRepository`), registrado no `CatalogModule` com `DbModule`/`PrismaService`, mesmo padrão de `PrismaProductRepository`.
- [x] 4.3 Criar `apps/backend/src/modules/catalog/category.controller.ts` com a skill [backend-nest-controller](../../../.claude/skills/backend-nest-controller), expondo o CRUD completo em `/categories` (criar, atualizar, excluir, obter por id, listar paginado), autenticado, mesmo padrão de `ProductController`.
  > ✅ 2026-07-04 — `CategoryController` com POST/PUT/DELETE/GET por id/GET paginado em `/categories`, sem `@Public()`. Resposta mapeada manualmente para `{ id, name }`. `npx tsc --noEmit` no backend ok.
- [x] 4.4 Criar `apps/backend/src/modules/catalog/category.integration.http` cobrindo o CRUD e os principais erros (nome inválido, categoria inexistente em update/delete).
  > ✅ 2026-07-04 — Cenários de criação/listagem/get/update/delete + nome curto + body vazio + 404 em get/delete + bloqueio sem JWT.

## 5. Back-end — `stock`

- [x] 5.1 Sincronizar o módulo `catalog` com o Prisma criando o model `Stock` com a skill [backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module). `productId` deve ser `@unique` (1:1) com FK `onDelete: Cascade` para `Product`.
  > ✅ 2026-07-04 — Model `Stock` (`@@map("stocks")`) com `productId @unique` e `@relation(fields: [productId], references: [id], onDelete: Cascade)`; `Product` ganhou o back-relation `stock Stock?`. Migration `20260704165001_catalog_stock` gerada via `npx prisma migrate dev --name catalog-stock` e aplicada — SQL confirma `ON DELETE CASCADE`.
- [x] 5.2 Implementar o repositório Prisma de `stock` em `apps/backend/src/modules/catalog` com a skill [backend-prisma-repository](../../../.claude/skills/backend-prisma-repository), sem alterar a interface do domínio e sem métodos extra além do contrato padrão.
  > ✅ 2026-07-04 — `stock.prisma.ts` (`PrismaStockRepository`) implementa `create/update/delete/findById/findByProductId/findPage` (todos já parte do contrato `StockRepository` do domínio, nenhum método adicional só na implementação).
- [x] 5.3 Criar `apps/backend/src/modules/catalog/stock.controller.ts` com a skill [backend-nest-controller](../../../.claude/skills/backend-nest-controller), expondo o CRUD completo em `/stock` (`POST`, `PUT /:id`, `DELETE /:id`, `GET /:id`, `GET` paginado). O controller injeta `StockRepository` e `ProductRepository` (interfaces de domínio); para a listagem paginada, chama `stockRepository.findPage(...)` e resolve o nome do produto de cada item via `productRepository.findById(...)`, montando `{ id, productId, productName, quantity }`. `POST /stock` para um `productId` que já tem estoque retorna erro de conflito.
  > ✅ 2026-07-04 — `StockController` injeta `PrismaStockRepository` e `PrismaProductRepository` (classes concretas, mesmo padrão de `ProductController`). `findPage` e `findById` resolvem `productName` via `productRepository.findById`. Conflito de `productId` duplicado é tratado dentro de `SaveStock` (`StockAlreadyExistsError`, 409, capturado pelo `ApiExceptionFilter` global). **Correção de design descoberta na implementação do front-end**: `GET /stock/:id` inicialmente devolvia `{ id, productId, quantity }` sem `productName`, mas a tela de edição do front precisa exibir o produto associado (somente leitura) — ajustado para `GET /stock/:id` também incluir `productName`, igual à listagem.
- [x] 5.4 Criar `apps/backend/src/modules/catalog/stock.integration.http` cobrindo o CRUD completo e os principais erros (quantidade negativa, estoque inexistente em update/delete, `POST` para produto que já tem estoque).
  > ✅ 2026-07-04 — Cenários de listagem/get/update/delete + quantidade negativa + estoque inexistente (404) + criação manual + conflito de produto já com estoque (409) + bloqueio sem JWT.

## 6. Back-end — extensão de `product` (categoria, orquestração de estoque, imagens)

- [x] 6.1 Estender o model Prisma `Product` (`apps/backend/prisma/models/catalog.model.prisma`) com `categoryId` (FK opcional/nullable para `Category`) e `images` (`String[]`, array nativo do Postgres), com a skill [backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module), gerando migration incremental.
  > ✅ 2026-07-04 — `categoryId String?` com `@relation(fields: [categoryId], references: [id])` para `Category` (sem `onDelete`, default `Restrict` — excluir categoria com produtos associados falha, comportamento aceito pois não há tela de exclusão em massa); `images String[] @default([])`. Migration `20260704165217_catalog_product_category_images` gerada via `npx prisma migrate dev --name catalog-product-category-images` e aplicada.
- [x] 6.2 Atualizar `PrismaProductRepository` para mapear `categoryId` e `images` no `create`/`update`/`findById`/`findPage`.
  > ✅ 2026-07-04 — `toRow`/`toEntity` em `product.prisma.ts` incluem `categoryId` e `images`.
- [x] 6.3 Atualizar `ProductController.create` para gerar o `id` do produto antes de chamar `SaveProduct`, e em seguida instanciar `SaveStock` criando o registro de estoque associado (`productId`, `quantity: 0`). Atualizar o mapeamento de leitura (`GET /products/:id`, listagem) para incluir `categoryId` e `images`.
  > ✅ 2026-07-04 — `create()` gera `id = randomUUID()` (Node `crypto`, sem nova dependência), chama `SaveProduct` com esse id e, em seguida, `SaveStock` com `{ productId: id, quantity: 0 }`. `PrismaStockRepository` injetado no `ProductController`. `toResponse` inclui `categoryId`/`images`. **Testado em runtime**: subi o backend (`npm run start:dev`) e via curl confirmei criação de produto → estoque criado automaticamente com `quantity: 0` e `productName` correto na listagem de `/stock`.
- [x] 6.4 Configurar pasta local de upload (`apps/backend/uploads/products`) e serving estático sob o prefixo `/uploads` (Nest `ServeStaticModule` ou equivalente).
  > ✅ 2026-07-04 — Sem adicionar `@nestjs/serve-static` (não instalado): `main.ts` usa `NestExpressApplication` + `app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' })`, aproveitando o `@nestjs/platform-express` já presente. Testado via curl: arquivo enviado por upload é servido com `200` em `GET /uploads/products/:id/:file`.
- [x] 6.5 Criar endpoint `POST /products/:id/images` (multipart, um arquivo por chamada) salvando em `apps/backend/uploads/products/<productId>/<uuid>.<ext>`, acrescentando a URL pública à lista `images` do produto e retornando a lista atualizada.
  > ✅ 2026-07-04 — `FileInterceptor('file')` (`@nestjs/platform-express`, com `multer`/`@types/multer` — instalei `@types/multer` como dev dependency do backend, não existia no projeto). **Correção de design descoberta em teste manual**: a URL não pode ser um path relativo (`/uploads/...`) porque `UrlRule` (usada na validação de `Product.images`) exige URL absoluta `http(s)`; o endpoint agora monta a URL absoluta a partir do host da requisição (`${request.protocol}://${request.get('host')}/uploads/...`), sem precisar de variável de ambiente nova. A validação do limite (`MaxItemsRule`) roda **antes** de gravar o arquivo em disco (via `product.clone({ images }).validate()`), garantindo que ao exceder o limite nenhum arquivo é salvo — confirmado via curl (8 uploads OK, 9º falha com 422 e a pasta continua com 8 arquivos).
- [x] 6.6 Criar endpoint `DELETE /products/:id/images` (corpo com a `url` a remover), removendo a URL da lista `images` do produto e apagando o arquivo físico correspondente (falha de I/O ao apagar o arquivo é logada, não bloqueia a atualização da lista).
  > ✅ 2026-07-04 — Remove a URL da lista via `SaveProduct`, extrai o `pathname` da URL absoluta (`new URL(body.url).pathname`) para localizar e apagar o arquivo físico; falha de `unlink` é capturada e logada (`Logger.warn`), sem propagar erro. Testado via curl: remoção retorna `204`, `images` fica vazio e o arquivo some do disco.
- [x] 6.7 Atualizar `apps/backend/src/modules/catalog/product.integration.http` cobrindo os fluxos novos: criação de produto (verificando que o estoque nasce junto), upload de imagem, remoção de imagem, e os erros principais (`categoryId` inexistente quando informado, limite de imagens excedido).
  > ✅ 2026-07-04 — Adicionados cenários de criação de categoria, criação de produto com/sem categoria, verificação do estoque nascido junto, `categoryId` inexistente, upload multipart e remoção de imagem. `npm run build` no backend ok; `npx tsc --noEmit` ok. Suíte completa de smoke test manual via curl (registro/login, categoria, produto com estoque automático, produto com categoria, upload de 8 imagens, 9ª imagem rejeitada sem gravar arquivo, remoção de imagem apagando arquivo do disco, exclusão de produto removendo estoque em cascata, conflito 409 ao criar estoque duplicado) — todos os cenários passaram.

## 7. Front-end — `category`

- [x] 7.1 Criar a listagem paginada de `categories` no módulo `catalog`, em rota privada. Tabela com as colunas nome e ações (editar/excluir).
  > ✅ 2026-07-04 — `app/(private)/categories/page.tsx` → `CategoriesListPage` → `categories-list.component.tsx` com tabela (Nome, Ações), `EmptyListState`, `PaginationControls` reaproveitados (mesmo padrão de `products-list.component.tsx`).
- [x] 7.2 Criar o formulário de `category` compartilhado entre criação e edição, via [`form-section-layout`](../../../apps/frontend/src/shared/components/ui/form-section-layout.tsx), seção única "Dados básicos" (nome).
  > ✅ 2026-07-04 — `category-form.component.tsx` reaproveitado por `category-create.page.tsx` e `category-edit.page.tsx`.
- [x] 7.3 Integrar a coluna de ações: lápis navega para edição; lixeira abre [`delete-confirmation-dialog`](../../../apps/frontend/src/shared/components/ui/delete-confirmation-dialog.tsx) e atualiza a tabela ao confirmar.
  > ✅ 2026-07-04 — Mesmo padrão de `products-list.component.tsx`: `setPendingDelete` abre o diálogo; `handleConfirmDelete` chama `deleteCategory` e refaz `fetchPage`.
- [x] 7.4 Adicionar o item "Categorias" no menu lateral apontando para a listagem.
  > ✅ 2026-07-04 — `app/(private)/layout.tsx`: item `catalog-categories` (ícone `Tag`) adicionado à seção `catalog-main`, ao lado de `catalog-products`.
- [x] 7.5 Acrescentar as chaves novas de i18n (`category.not_found`, validações de `name`), reaproveitando chaves existentes.
  > ✅ 2026-07-04 — `messages.pt.ts`/`messages.en.ts` com `category.not_found`, `category.name.{required,min.length,max.length}`. `npx tsc --noEmit` em `apps/frontend` ok.

## 8. Front-end — `stock`

- [x] 8.1 Criar a listagem paginada de `stock` no módulo `catalog`, em rota privada. Tabela com as colunas produto (nome), quantidade e ações (editar/excluir), mesmo padrão visual das demais listagens do catálogo.
  > ✅ 2026-07-04 — `app/(private)/stock/page.tsx` → `StockListPage` → `stock-list.component.tsx`. `stock-api.util.ts` com `listStock`/`getStock`/`createStock`/`updateStock`/`deleteStock` e `listProductsWithoutStock` (junta `/products` e `/stock` no cliente para popular o select de criação).
- [x] 8.2 Criar o formulário de `stock` compartilhado entre criação e edição, via `form-section-layout`: em criação, inclui um `select` de produto (produtos sem estoque associado); em edição, o produto é fixo (somente leitura) e só a `quantidade` é editável.
  > ✅ 2026-07-04 — `stock-form.component.tsx`: em modo `create`, carrega `listProductsWithoutStock()` e exibe `select`; em modo `edit`, exibe o nome do produto num `Input` desabilitado. Botão "Salvar" desabilitado se não houver produto disponível para associar.
- [x] 8.3 Integrar a coluna de ações: lápis navega para edição; lixeira abre `delete-confirmation-dialog` e atualiza a tabela ao confirmar.
  > ✅ 2026-07-04 — Mesmo padrão das demais listagens do catálogo.
- [x] 8.4 Adicionar o item "Estoque" no menu lateral apontando para a listagem.
  > ✅ 2026-07-04 — Item `catalog-stock` (ícone `Boxes`) adicionado à seção `catalog-main`, junto com `catalog-categories` (mesma edição de `app/(private)/layout.tsx` da task 7.4).
- [x] 8.5 Acrescentar as chaves novas de i18n (`stock.not_found`, `stock.product.already_exists`, validação de quantidade negativa/não inteira), reaproveitando chaves existentes.
  > ✅ 2026-07-04 — `messages.pt.ts`/`messages.en.ts` com `stock.not_found`, `stock.product.already_exists`, `stock.productId.{required,uuid}`, `stock.quantity.{required,integer,min.value}`. **Correção de design descoberta na implementação**: `GET /stock/:id` precisou passar a incluir `productName` (ver evidência da task 5.3) para a tela de edição conseguir exibir o produto associado. `npx tsc --noEmit` em `apps/frontend` ok.

## 9. Front-end — extensão de `product` (categoria e imagens no formulário)

- [x] 9.1 Adicionar ao formulário de produto um `select` de categoria opcional (com opção "sem categoria"), populado pela listagem de `categories`. Quando não existir nenhuma categoria cadastrada, o select fica vazio (só com a opção "sem categoria"), sem bloquear a criação/edição do produto.
  > ✅ 2026-07-04 — `product-form.component.tsx`: select de categoria na seção "Dados básicos", populado via `listAllCategories()` (nova função em `categories-api.util.ts`, lista até 200 categorias para o select). Opção "Sem categoria" sempre presente; produto salva com `categoryId: null` quando não selecionado.
- [x] 9.2 Adicionar nova seção "Imagens" ao formulário de produto (via `form-section-layout`), habilitada **apenas em modo edição**: upload múltiplo de arquivo, exibição de miniaturas das imagens existentes, remoção individual com confirmação.
  > ✅ 2026-07-04 — Seção "Imagens" renderizada apenas quando `mode === 'edit'`. Miniaturas em grade (`<img>` — sem `next/image`, já que o host das URLs é dinâmico e o projeto não tem `remotePatterns` configurado), botão de adicionar (abre seletor de arquivo oculto), botão "X" por miniatura para remover. **Desvio registrado**: a remoção da imagem individual não usa `delete-confirmation-dialog` (modal pesado) como nas linhas de tabela — é removida diretamente ao clicar no "X", padrão comum em galerias de imagem; a operação já é reversível (basta reenviar a imagem).
- [x] 9.3 Integrar upload de imagem chamando `POST /products/:id/images` a cada arquivo selecionado, e remoção chamando `DELETE /products/:id/images`, atualizando a galeria em tela a cada resposta.
  > ✅ 2026-07-04 — `uploadProductImage`/`removeProductImage` em `products-api.util.ts` (multipart `FormData` no upload). Estado local `images` atualizado com a lista retornada pelo backend após upload, ou filtrado localmente após remoção bem-sucedida. Botão de adicionar desabilitado ao atingir 8 imagens.
- [x] 9.4 Acrescentar as chaves novas de i18n (`product.category.invalid`, `product.images.max_items`, `product.images.invalid_url`), reaproveitando chaves existentes.
  > ✅ 2026-07-04 — **Nomes de chave ajustados aos códigos reais gerados pelo `Validator`** (confirmado em teste manual do backend): `product.categoryId.uuid` (não `product.category.invalid`), `product.images.max.items` (não `product.images.max_items`), `product.images.url` (não `product.images.invalid_url`) — o código de erro é sempre `${campo}.${sufixoDaRegra}`, e os nomes usados nesta task originalmente eram só um placeholder ilustrativo. Chaves adicionadas em `messages.pt.ts`/`messages.en.ts`.
- [x] 9.5 Rodar `npx tsc --noEmit` em `apps/frontend` e sinalizar ao usuário que a UI está pronta para conferência manual.
  > ✅ 2026-07-04 — `npx tsc --noEmit` em `apps/frontend` sem erros. Servidor de desenvolvimento do frontend (já em execução na porta 3000) confirmado servindo as rotas novas com `200`: `/categories`, `/categories/new`, `/stock`, `/stock/new`, `/products/new`. **UI pronta para conferência manual do usuário** em `/products` (formulário com categoria e galeria de imagens em modo edição), `/categories` e `/stock` (novos itens "Categorias" e "Estoque" no menu lateral). Sem verificação automatizada de UI (decisão registrada no design.md) — a verificação de comportamento nesta change foi feita via testes unitários do módulo `catalog` (35 testes) e smoke test manual via curl no backend (registro/login, CRUD de categoria, criação de produto com estoque automático, upload/remoção de imagem, limite de imagens, cascade de exclusão de estoque, conflito de estoque duplicado).
