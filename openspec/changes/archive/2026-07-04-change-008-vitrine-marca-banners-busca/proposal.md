## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Why

A vitrine pública (`/loja`, entregue na change-007) hoje é genérica: sem identidade visual da loja (sem logo), sem destaque editorial de categorias/promoções (sem banners) e sem forma de encontrar um produto específico numa lista que só cresce (sem busca nem filtro). Esta change fecha essas lacunas de "vitrine profissional" sem tocar em estoque, pedido ou checkout — que ficam para uma change separada (change-009), dado o risco e escopo distintos (transação, concorrência).

## What Changes

- Adicionar o campo `logoUrl` (opcional) ao agregado singleton `store-settings` (módulo `settings`).
- Expor `POST /settings/logo` (multipart, autenticado) e `DELETE /settings/logo`, reaproveitando o padrão de upload de imagem local já usado por produto (pasta local, servida estaticamente, URL absoluta montada a partir do host da requisição).
- Estender a tela de "Configurações" (admin) com upload, preview e remoção da logo, ao lado do campo de WhatsApp.
- Exibir a logo (quando configurada) no header da vitrine pública `/loja`, substituindo o ícone/título genérico atual.
- Criar o agregado `banner` no módulo `catalog`: `imageUrl` (obrigatório), `position` (inteiro, ordem de exibição), `categoryId` (obrigatório, referência a uma `category` existente — destino do clique). Regra: **no máximo 3 banners simultâneos** — `save-banner` rejeita a criação de um 4º.
- Expor CRUD completo de `banner` em `/banners` (autenticado) e um endpoint standalone `POST /banners/upload-image` (sem exigir um banner já existente, já que `imageUrl` é obrigatória na criação — o frontend faz upload primeiro, recebe a URL, depois cria/atualiza o banner).
- Criar tela admin "Banners" (listar ordenado por `position` com reordenação, criar, editar, excluir), item novo no menu lateral.
- Na vitrine pública, exibir um carrossel/hero com os banners cadastrados (ordenados por `position`) no topo da grade de produtos; clicar num banner navega para `/loja` filtrado pela `categoryId` daquele banner.
- Adicionar campo de busca por nome (client-side, substring case-insensitive) na vitrine, filtrando a lista de produtos já carregada por `GET /storefront/products`.
- Adicionar filtro por categoria (client-side, dropdown com o **nome** da categoria) na vitrine — o frontend busca `/categories` para montar as opções e mapear `categoryId` → nome.
- Rodar `npx tsc --noEmit` em `apps/frontend` ao final e sinalizar ao usuário que a UI está pronta para conferência manual. **Sem verificação automatizada de UI nesta change.**

## Capabilities

### New Capabilities

- `catalog-banner-domain`: Agregado `banner` no módulo `catalog` com entidade validada (`imageUrl`, `position`, `categoryId`), contrato de repositório, casos de uso `save-banner` (com regra de máximo 3 na criação) e `delete-banner`, cobertura unitária com fakes.
- `catalog-banner-backend`: Model Prisma de `banner` (FK `categoryId` para `Category`), repositório Prisma, `BannerController` autenticado em `/banners` (CRUD completo), endpoint de upload de imagem reaproveitado, cobertura HTTP em `banner.integration.http`.
- `catalog-banner-frontend`: Tela admin "Banners" (listar ordenado por `position` com reordenação, criar, editar, excluir), item "Banners" no menu lateral, i18n complementar.

### Modified Capabilities

- `settings-domain`: `StoreSettings` ganha o campo `logoUrl` (opcional, nullable, validado como URL quando informado).
- `settings-backend`: novos endpoints `POST /settings/logo` e `DELETE /settings/logo` (autenticados), reaproveitando a infraestrutura de upload local já criada para produto; `GET /settings` passa a incluir `logoUrl`.
- `settings-frontend`: tela "Configurações" ganha upload/preview/remoção da logo.
- `storefront-frontend`: header da vitrine exibe a logo configurada (ou o fallback atual quando não configurada); carrossel de banners no topo da grade; campo de busca por nome; filtro por categoria com nome — ambos client-side sobre a lista já carregada.

## Impact

- Estende o model Prisma de `settings` (`logoUrl`) e adiciona o model `Banner` ao módulo `catalog`, com migrations incrementais.
- Adiciona `apps/backend/src/modules/catalog/{banner.prisma.ts,banner.controller.ts,banner.integration.http}` e registra no `CatalogModule`.
- Estende `apps/backend/src/modules/settings/settings.controller.ts` com os endpoints de logo.
- Adiciona ao frontend a tela de Banners (admin), estende a tela de Configurações, e estende a vitrine pública com logo no header, carrossel de banners, busca e filtro por categoria.
- Reaproveita integralmente a infraestrutura de upload de imagem local introduzida na change-006/007 — nenhuma infraestrutura nova de armazenamento é criada.
- Não altera nada relacionado a estoque, pedido ou checkout — esse escopo fica para a change-009.
