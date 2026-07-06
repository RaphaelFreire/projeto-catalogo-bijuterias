## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Why

O módulo `catalog` hoje só tem o agregado `product`, com campos de precificação e disponibilidade, mas sem categorização, sem controle de estoque e sem imagens. Esta change amplia o que significa "produto" no catálogo, adicionando dois agregados novos (`category` e `stock`) e uma galeria de imagens acoplada ao próprio `product`, seguindo o mesmo template de CRUD já validado nas changes anteriores (change-004, change-005).

## What Changes

- Criar o agregado `category` dentro do módulo `catalog`: entidade `Category` (`name`), contrato de repositório, casos de uso `save-category`/`delete-category`, testes unitários com fakes.
- Expor CRUD HTTP autenticado de `category` em `/categories` e entregar listagem paginada + formulário + item de menu "Categorias" no frontend, seguindo o template de CRUD já usado para `product`.
- Estender a entidade `Product` com o campo `categoryId` (opcional, referência a uma `category` existente quando informado) e com o campo `images` (lista ordenada de URLs, vazia por padrão).
- Estender o formulário de produto com um `select` de categoria opcional (populado pela listagem de categorias, com opção "sem categoria") e uma nova seção "Imagens" com upload múltiplo, miniaturas e remoção individual.
- Criar endpoint de upload de imagem (`POST /products/:id/images`) que grava o arquivo em pasta local no backend, serve os arquivos estaticamente e persiste a URL retornada na lista `images` do produto; endpoint de remoção (`DELETE /products/:id/images`) que remove a URL da lista e apaga o arquivo do disco.
- Criar o agregado `stock` dentro do módulo `catalog`: entidade `Stock` (`productId`, `quantity`), contrato de repositório, casos de uso `save-stock`/`delete-stock`, testes unitários com fakes.
- Orquestrar, em `ProductController.create`, a criação automática do registro de `stock` associado (quantidade inicial `0`) logo após a criação do produto.
- Expor `stock` com CRUD completo em `/stock` (criar, atualizar, excluir, obter por id, listar paginado com nome do produto), mesmo padrão de `category`/`product`. A criação automática ao criar produto é uma via adicional, não a única.
- Entregar tela própria "Estoque" no frontend: listagem paginada de produto + quantidade, com ações de criar, editar e excluir, mesmo padrão visual das demais listagens do catálogo.
- Sincronizar os models Prisma novos (`Category`, `Stock`) e a extensão do model `Product` (`categoryId`, `images`), com migration incremental.
- Acrescentar chaves novas no i18n (`category.*`, `stock.*`, mensagens de validação dos campos novos), reaproveitando chaves existentes quando aplicável.
- Rodar `npx tsc --noEmit` em `apps/frontend` ao final e sinalizar ao usuário que a UI está pronta para conferência manual. Sem verificação automatizada de UI nesta change.

## Capabilities

### New Capabilities

- `catalog-category-domain`: Agregado `category` no módulo `catalog` com entidade validada, contrato de repositório, casos de uso `save-category`/`delete-category` e cobertura unitária com fakes.
- `catalog-category-backend`: Model Prisma de `category`, repositório Prisma, `CategoryController` autenticado em `/categories` (CRUD) e cobertura HTTP em `category.integration.http`.
- `catalog-category-frontend`: Listagem paginada, formulário, ações de edição/exclusão, item "Categorias" no menu lateral e i18n complementar.
- `catalog-stock-domain`: Agregado `stock` no módulo `catalog` com entidade validada (1:1 com `product` via `productId`), contrato de repositório, casos de uso `save-stock`/`delete-stock` e cobertura unitária com fakes.
- `catalog-stock-backend`: Model Prisma de `stock` (FK `productId` com `onDelete: Cascade`), repositório Prisma, `StockController` autenticado em `/stock` expondo CRUD completo (o controller junta `StockRepository` e `ProductRepository` para enriquecer a listagem com o nome do produto, sem método extra na implementação Prisma), e cobertura HTTP em `stock.integration.http`.
- `catalog-stock-frontend`: Tela própria "Estoque" com listagem paginada de produto + quantidade e ações de criar, editar e excluir, item "Estoque" no menu lateral e i18n complementar.

### Modified Capabilities

- `catalog-product-domain`: `Product` ganha os campos `categoryId` (opcional, referência a `category` quando informado) e `images` (lista ordenada de URLs, `MaxItemsRule`, cada item validado por `UrlRule`).
- `catalog-product-backend`: `ProductController.create` passa a orquestrar a criação do registro de `stock` associado; model Prisma de `Product` ganha `categoryId` (FK) e `images` (array nativo); novos endpoints `POST /products/:id/images` e `DELETE /products/:id/images` para upload/remoção de imagens em pasta local, com serving estático.
- `catalog-product-frontend`: formulário de produto ganha `select` de categoria e seção "Imagens" (upload múltiplo, miniaturas, remoção). Gerenciamento de imagens habilitado apenas em modo edição (produto precisa existir antes de anexar imagens).

## Impact

- Adiciona ao módulo `catalog` os agregados `category` e `stock` (entidade, contrato de repositório, casos de uso e testes de cada um).
- Estende o model `catalog.model.prisma` com `Category`, `Stock` e os campos novos em `Product` (`categoryId`, `images`), com migration incremental.
- Adiciona `apps/backend/src/modules/catalog/{category.prisma.ts,category.controller.ts,category.integration.http,stock.prisma.ts,stock.controller.ts,stock.integration.http}`, os endpoints de imagem em `product.controller.ts` e configuração de servir arquivos estáticos (pasta local de upload).
- Adiciona ao frontend as telas de categoria e estoque (rota privada, listagem, formulário quando aplicável) e estende a tela de produto com seleção de categoria e galeria de imagens.
- Estende `messages.pt.ts` e `messages.en.ts` com as chaves novas (`category.*`, `stock.*`, `product.category.*`, `product.images.*`).
- Introduz a primeira relação entre agregados do projeto (`Product` → `Category`, `Product` → `Stock`), e a primeira integração de upload/armazenamento de arquivo do projeto — ambos precedentes para changes futuras que envolvam relações e mídia.
