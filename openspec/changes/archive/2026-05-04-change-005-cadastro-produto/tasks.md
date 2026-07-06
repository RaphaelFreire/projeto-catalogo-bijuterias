## Instruções Compartilhadas

Estas instruções valem para qualquer change deste projeto e devem ser respeitadas durante a execução das tasks abaixo:

- [Como executar](../../shared/como-executar.md) — regras de execução e formato de evidência por task.
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md) — convenções de nomes de arquivos e diretórios.

## 1. Negócio (módulo catalog)

- [x] 1.1 Criar o agregado `product` dentro do módulo `catalog` com a skill [module-aggregate](../../../.claude/skills/module-aggregate).
  > ✅ 2026-05-04 20:14 — `modules/catalog` scaffoldado via `config-new-module` (corrigi o `package.json` que veio com placeholder `__package_name__` para `@sdd/catalog`); agregado `product` criado via `module-aggregate --mode crud`. Removidos os usecases CRUD genéricos não usados.
- [x] 1.2 Implementar a entidade `Product` com a skill [module-entity](../../../.claude/skills/module-entity), com os campos: `name` (required, min-length 2, max-length 120), `description` (max-length 500, opcional), `price` (required, min-value 0, precision 2), `status` (required, in `active|inactive|draft`), `availableOnline` (boolean, default `false`), `featured` (boolean, default `false`), `allowsPreOrder` (boolean, default `false`).
  > ✅ 2026-05-04 20:16 — `modules/catalog/src/product/model/product.entity.ts` com `ProductState`, `ProductInput`, getters e `validate()` usando regras do `@sdd/shared` (`RequiredRule`, `MinLengthRule`, `MaxLengthRule`, `MinValueRule`, `PrecisionRule`, `InRule`). Tipo `ProductStatus` e constante `PRODUCT_STATUS_VALUES` exportados. Booleans assumem `false` quando ausentes; `description` é normalizado para `null` quando ausente.
- [x] 1.3 Definir o contrato do repositório de `product` com a skill [module-repository](../../../.claude/skills/module-repository).
  > ✅ 2026-05-04 20:16 — `ProductRepository` herdando de `CrudRepository<Product, Product, Product, ProductPageParams>` (sem campos extras além do CRUD básico).
- [x] 1.4 Implementar o caso de uso `save-product` com a skill [module-use-case](../../../.claude/skills/module-use-case). A decisão entre criar e atualizar deve ser baseada em uma consulta ao repositório (`findById`): se `id` vier na entrada e `findById` retornar um registro, executa atualização; caso contrário (sem `id` ou registro não encontrado), executa criação usando o `id` recebido ou gerando um novo.
  > ✅ 2026-05-04 20:18 — `save-product.usecase.ts` com `SaveProductIn`. Criação preserva o `id` recebido ou deixa o `Entity` gerar; atualização usa `clone(...)` mantendo defaults dos booleanos da entidade existente quando o input não os informa. `validate()` invocado nos dois fluxos.
- [x] 1.5 Implementar o caso de uso `delete-product` com a skill [module-use-case](../../../.claude/skills/module-use-case). Lançar `DomainError("product.not_found", 404)` quando o `id` não existir.
  > ✅ 2026-05-04 20:18 — `ProductNotFoundError` em `modules/catalog/src/product/error` (estende `NotFoundError` com mensagem `product.not_found`); `delete-product.usecase.ts` consulta `findById` antes de excluir.
- [x] 1.6 Cobrir os dois casos de uso com testes unitários, usando os fakes do módulo (`FakeProductRepository` e demais providers necessários).
  > ✅ 2026-05-04 20:19 — `FakeProductRepository` em `modules/catalog/test/mock`; suíte cobre criação sem id, criação com id, atualização, validações (nome curto, preço negativo, preço com mais de 2 casas, status fora do enum), exclusão de existente e de inexistente. `npm run test --workspace @sdd/catalog` → 11 testes passando.

## 2. Back-end

- [x] 2.1 Sincronizar o módulo `catalog` com o Prisma criando/atualizando o model da entidade `product` com a skill [backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module).
  > ✅ 2026-05-04 20:18 — `apps/backend/prisma/models/catalog.model.prisma` com model `Product` (`@@map("products")`), `price` como `Decimal(12,2)`, `status` como `String`, descrição opcional. Migration `20260504201828_catalog` gerada via `npm run prisma:migrate:dev -- --name catalog` e aplicada.
- [x] 2.2 Implementar o repositório Prisma de `product` em `apps/backend/src/modules/catalog` com a skill [backend-prisma-repository](../../../.claude/skills/backend-prisma-repository), sem alterar a interface definida no módulo.
  > ✅ 2026-05-04 20:21 — `apps/backend/src/modules/catalog/product.prisma.ts` (`PrismaProductRepository` injetando `PrismaService`). Mapeia `Decimal` ↔ `number`, `description` nullable, registro no `CatalogModule` com `DbModule` e export do provider.
- [x] 2.3 Criar/atualizar `apps/backend/src/modules/catalog/product.controller.ts` com a skill [backend-nest-controller](../../../.claude/skills/backend-nest-controller), expondo o CRUD em `/products` (criar, atualizar, excluir, obter por id e listar paginado). Endpoints autenticados. Consultas chamam o repositório direto; comandos instanciam o caso de uso correspondente no corpo do método.
  > ✅ 2026-05-04 20:23 — `ProductController` com POST/PUT/DELETE/GET por id e GET paginado em `/products`. Comandos instanciam `SaveProduct`/`DeleteProduct` no corpo; `GET` chama `productRepository.findById/findPage` direto. Resposta sempre mapeada para objeto simples `{ id, name, description, price, status, availableOnline, featured, allowsPreOrder }`. Sem `@Public()`. `npx tsc --noEmit` no backend ok após `prisma:generate`.
- [x] 2.4 Criar `apps/backend/src/modules/catalog/product.integration.http` (Rest Client) cobrindo os fluxos do CRUD, incluindo os principais casos de erro (nome inválido, preço negativo, status fora do enum, produto inexistente em update/delete). Validar manualmente com o backend rodando.
  > ✅ 2026-05-04 20:24 — Cenários de criação/listagem/get/update/delete + casos de erro (nome curto, preço negativo, status `archived`, body vazio) + 404 em update/delete inexistentes + bloqueios sem JWT.

## 3. Front-end

- [x] 3.1 Criar a listagem paginada de `products` no módulo `catalog`, em rota privada. Tabela com as colunas nome, preço, status e ações (ícones de editar e excluir).
  > ✅ 2026-05-04 20:28 — `app/(private)/products/page.tsx` → `ProductsListPage` no módulo `catalog`. `products-list.component.tsx` com tabela (Nome, Preço — formato BRL, Status — i18n, Ações), `EmptyListState`, `PaginationControls` reaproveitados.
- [x] 3.2 Criar o formulário de `product` compartilhado entre criação e edição, organizado em seções via [`form-section-layout`](../../../apps/frontend/src/shared/components/ui/form-section-layout.tsx): "Dados básicos" (nome, descrição), "Preço e status" (preço, status como `select` com as opções `active`, `inactive`, `draft`) e "Disponibilidade" (checkboxes `availableOnline`, `featured`, `allowsPreOrder`).
  > ✅ 2026-05-04 20:29 — `product-form.component.tsx` reaproveitado por `product-create.page.tsx` e `product-edit.page.tsx`. Três `FormSectionLayout`: Dados básicos (`Input` + `Textarea`), Preço e status (`Input` numérico + `<select>` nativo estilizado iterando `PRODUCT_STATUSES` e usando i18n `product.status.*`), Disponibilidade (`Checkbox` controlados, independentes).
- [x] 3.3 Integrar a coluna de ações: lápis navega para a edição; lixeira abre [`delete-confirmation-dialog`](../../../apps/frontend/src/shared/components/ui/delete-confirmation-dialog.tsx) e, ao confirmar, chama o backend e atualiza a tabela.
  > ✅ 2026-05-04 20:28 — Lápis → `router.push('/products/${id}')`; lixeira → `setPendingDelete` abrindo `DeleteConfirmationDialog`. `handleConfirmDelete` chama `deleteProduct` e refaz `fetchPage` (volta uma página quando excluir o último item da página).
- [x] 3.4 Adicionar o item "Produtos" no menu lateral apontando para a listagem de `products`.
  > ✅ 2026-05-04 20:31 — `app/(private)/layout.tsx`: novo módulo `catalog` em `APP_MODULES` com seção `Catálogo` → item `Produtos` apontando para `/products` (ícone `Package` do lucide).
- [x] 3.5 Acrescentar no i18n as chaves novas que aparecerem (ex.: `product.not_found`, rótulos de status `product.status.active|inactive|draft` e mensagens específicas de validação dos novos campos). Reaproveitar as chaves já cadastradas em specs anteriores.
  > ✅ 2026-05-04 20:32 — `messages.pt.ts` e `messages.en.ts` com `product.not_found`, `product.status.{active,inactive,draft}`, `product.name.{required,min.length,max.length}`, `product.description.max.length`, `product.price.{required,min.value,precision}`, `product.status.{required,in}`. Chaves genéricas existentes (ex.: `DEFAULT_API_ERROR`) reaproveitadas pelo fluxo de erro do `ProductsApiError`.
- [x] 3.6 Rodar `npx tsc --noEmit` em `apps/frontend` e sinalizar ao usuário que a UI está pronta para conferência manual.
  > ✅ 2026-05-04 20:33 — `npx tsc --noEmit` em `apps/frontend` finalizou sem erros. UI pronta para conferência manual em `/products` (listagem, criação em `/products/new`, edição em `/products/[id]`); confira também o item "Produtos" no menu lateral. **Sem verificação automatizada de UI nesta change** (decisão registrada em `design.md`).
