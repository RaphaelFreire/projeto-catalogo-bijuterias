# catalog-storefront-backend Specification

## Purpose
TBD - created by change-007-vitrine-publica-whatsapp. Update Purpose after archive.

## Requirements

### Requirement: `GET /storefront/products` público, filtrado por status ativo

O backend SHALL incluir `apps/backend/src/modules/catalog/storefront.controller.ts` expondo `GET /storefront/products`, marcado com `@Public()`, retornando **apenas** produtos com `status: 'active'`. Este endpoint NÃO PODE expor produtos com outro status, nem os endpoints de comando (criar/atualizar/excluir) do CRUD administrativo.

#### Scenario: Apenas produtos ativos retornados

- **WHEN** `GET /storefront/products` é chamado
- **THEN** a resposta contém somente produtos com `status: 'active'`
- **AND** produtos com `status: 'inactive'` ou `'draft'` não aparecem

#### Scenario: Acesso público, sem JWT

- **WHEN** uma requisição `GET /storefront/products` chega sem JWT
- **THEN** o backend responde com sucesso (não `401`)

### Requirement: Cada item inclui a quantidade em estoque

O handler SHALL resolver, para cada produto retornado, a quantidade em estoque associada via `StockRepository.findByProductId(...)` (contrato de domínio já existente, sem alteração). Produtos sem registro de estoque SHALL aparecer com `quantity: 0`.

#### Scenario: Quantidade presente em cada item

- **WHEN** `GET /storefront/products` é chamado
- **THEN** cada item da resposta inclui `quantity`, resolvida via `StockRepository.findByProductId`

#### Scenario: Produto com estoque zero não é omitido

- **WHEN** um produto ativo tem `quantity: 0`
- **THEN** ele ainda aparece na resposta, com `quantity: 0` (o filtro de disponibilidade é responsabilidade do frontend, não deste endpoint)

### Requirement: Mapeamento de leitura para objeto simples

Toda resposta de `GET /storefront/products` SHALL ser construída explicitamente como lista de objetos simples, contendo `{ id, name, description, price, images, categoryId, quantity }`. Campos administrativos não relevantes para a vitrine (ex.: `availableOnline`, `featured`, `allowsPreOrder`) PODEM ser omitidos.

#### Scenario: Resposta contém os campos da vitrine

- **WHEN** `GET /storefront/products` é executado com sucesso
- **THEN** cada item contém `id`, `name`, `description`, `price`, `images`, `categoryId` e `quantity`

### Requirement: Cobertura HTTP em `storefront.integration.http`

O backend SHALL incluir `apps/backend/src/modules/catalog/storefront.integration.http` (Rest Client) cobrindo: listagem retornando só produtos ativos, produto com estoque zero presente na resposta, acesso sem JWT bem-sucedido.

#### Scenario: Cenários presentes

- **WHEN** `storefront.integration.http` é inspecionado
- **THEN** existe cenário confirmando que produtos não-ativos são excluídos
- **AND** existe cenário de produto com `quantity: 0`
- **AND** existe cenário de acesso sem JWT
