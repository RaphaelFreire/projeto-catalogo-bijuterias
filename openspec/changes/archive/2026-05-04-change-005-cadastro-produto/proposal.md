## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Why

O módulo `catalog` já existe, mas ainda não tem agregado nem CRUD. Esta change entrega o **CRUD de `product`** ponta a ponta — agregado, persistência via Prisma, endpoints autenticados, listagem paginada e formulário compartilhado entre criação e edição. O CRUD de produto exercita o mesmo template do CRUD de usuário (change-004) em outro módulo, validando que o padrão é generalizável e habilitando o catálogo de produtos da aplicação.

## What Changes

- Criar o agregado `product` dentro do módulo `catalog`.
- Implementar a entidade `Product` com validações: `name` (required, min-length 2, max-length 120), `description` (max-length 500, opcional → `null` quando ausente), `price` (required, min-value 0, precision 2), `status` (required, in `active|inactive|draft`), `availableOnline`/`featured`/`allowsPreOrder` (booleanos independentes, default `false` na criação).
- Definir o contrato do repositório de `product` no módulo.
- Implementar `save-product` (cria/atualiza decidindo por `findById`) e `delete-product` (com `DomainError("product.not_found", 404)` quando o `id` não existir).
- Cobrir os dois casos de uso com testes unitários usando `FakeProductRepository` e demais fakes necessários.
- Sincronizar o módulo `catalog` com o Prisma (model + migration).
- Implementar o repositório Prisma de `product` em `apps/backend/src/modules/catalog`, sem alterar a interface do módulo.
- Criar/atualizar `apps/backend/src/modules/catalog/product.controller.ts` expondo `/products` autenticado: criar, atualizar, excluir, obter por id e listar paginado. Consultas via repositório direto; comandos via caso de uso instanciado no corpo do método. Respostas de leitura mapeadas para objetos simples com todos os campos públicos do produto.
- Criar `apps/backend/src/modules/catalog/product.integration.http` cobrindo CRUD e principais erros (nome inválido, preço negativo, status fora do enum, produto inexistente em update/delete).
- Frontend: listagem paginada em rota privada do módulo `catalog`, com colunas nome/preço/status/ações (editar/excluir).
- Frontend: formulário compartilhado em três seções via `form-section-layout` — "Dados básicos" (nome, descrição), "Preço e status" (preço, status como `select` com `active|inactive|draft`), "Disponibilidade" (checkboxes `availableOnline`, `featured`, `allowsPreOrder`).
- Integrar coluna de ações (lápis edita; lixeira abre `delete-confirmation-dialog` e atualiza tabela ao confirmar).
- Adicionar item "Produtos" no menu lateral apontando para a listagem.
- Acrescentar no i18n as chaves novas (ex.: `product.not_found`, rótulos `product.status.active|inactive|draft`, validações específicas), reaproveitando chaves já cadastradas.
- Rodar `npx tsc --noEmit` em `apps/frontend` e sinalizar ao usuário que a UI está pronta para conferência manual.
- **Sem verificação automatizada de UI nesta change**: validações automatizadas vão até a camada backend; UI conferida manualmente.

## Capabilities

### New Capabilities

- `catalog-product-domain`: Agregado `product` no módulo `catalog` com entidade validada, contrato de repositório, casos de uso `save-product` (cria/atualiza) e `delete-product`, e cobertura unitária com fakes.
- `catalog-product-backend`: Model Prisma de `product`, repositório Prisma, `ProductController` autenticado em `/products` (CRUD com mapeamento de leitura para objeto simples) e cobertura HTTP em `product.integration.http`.
- `catalog-product-frontend`: Listagem paginada, formulário compartilhado em três seções, ações de edição/exclusão, item "Produtos" no menu lateral e i18n complementar — sem verificação automatizada de UI.

### Modified Capabilities

<!-- Nenhuma capability existente é modificada em nível de requisito. As capabilities anteriores permanecem inalteradas. Esta change estende o módulo `catalog` (que já existe) com seu primeiro agregado e expõe o CRUD correspondente, sem alterar comportamento existente. -->

## Impact

- Adiciona ao módulo `catalog` o agregado `product` (entidade, contrato de repositório, casos de uso e testes).
- Adiciona ao backend o model `catalog.model.prisma` (ou estende o existente) e gera migration incremental.
- Adiciona `apps/backend/src/modules/catalog/{product.prisma.ts,product.controller.ts,product.integration.http}` e a registração do controller no módulo Nest.
- Adiciona ao frontend a listagem em rota privada dentro do módulo `catalog`, formulário compartilhado e item de menu "Produtos".
- Estende `messages.pt.ts` e `messages.en.ts` com as chaves novas (`product.not_found`, `product.status.*`, mensagens de validação dos campos).
- Habilita changes futuras (categorias, estoque, preços promocionais, integração com checkout) a serem implementadas sobre o agregado `product` já existente.
