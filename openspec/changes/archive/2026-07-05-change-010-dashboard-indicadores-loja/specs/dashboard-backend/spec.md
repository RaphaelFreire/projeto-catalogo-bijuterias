# dashboard-backend Specification

## Purpose
TBD - created by change-010-dashboard-indicadores-loja. Update Purpose after archive.

## Requirements

### Requirement: Índice em `Order.createdAt`

O backend SHALL incluir `@@index([createdAt])` no model Prisma `Order` (`apps/backend/prisma/models/catalog.model.prisma`), com migration incremental aplicada, sem alterar nenhum campo ou comportamento existente do agregado `Order`.

#### Scenario: Índice presente e migration aplicada

- **WHEN** o model `Order` é inspecionado após esta change
- **THEN** existe um índice sobre `createdAt`
- **AND** uma migration nomeada por módulo é gerada e aplicada

### Requirement: Repositório Prisma de `dashboard`, com agregação nativa e `$queryRaw` para série temporal

O backend SHALL incluir uma implementação Prisma de `DashboardRepository` em `apps/backend/src/modules/dashboard`. `getStockSummary` e `getOrderSummary` SHALL usar `aggregate`/`count` nativos do Prisma. `getCriticalStock` SHALL usar `findMany` filtrando `quantity: 1`, enriquecendo cada item com o nome do produto (mesmo padrão de resolução de `productName` já usado em `stock.controller.ts`). `getOrdersByPeriod` SHALL usar `prisma.$queryRaw` com `date_trunc('day' | 'week' | 'month', "createdAt")` do Postgres para agrupar contagem e soma de `total` por período, dentro do intervalo `[from, to]`.

#### Scenario: Repositório implementa contrato estável

- **WHEN** o repositório Prisma de `dashboard` é construído
- **THEN** ele fica em `apps/backend/src/modules/dashboard/dashboard.prisma.ts`
- **AND** implementa a interface do módulo `dashboard` sem alterá-la
- **AND** está registrado no módulo Nest com `DbModule` e `PrismaService`

#### Scenario: Nenhuma agregação é feita trazendo todos os pedidos para o Node

- **WHEN** `getOrderSummary` ou `getOrdersByPeriod` são executados
- **THEN** a soma/contagem/agrupamento acontece inteiramente na consulta ao banco (via `aggregate`, `count` ou `$queryRaw`), sem carregar a lista completa de pedidos na aplicação para somar em memória

### Requirement: `DashboardController` autenticado, somente leitura

O backend SHALL incluir `apps/backend/src/modules/dashboard/dashboard.controller.ts` expondo **apenas** `GET /dashboard/summary`, `GET /dashboard/critical-stock` e `GET /dashboard/orders-by-period`, todos autenticados (sem `@Public()`). O controller NÃO PODE expor `POST`, `PUT` nem `DELETE` — não há nada para criar, atualizar ou excluir neste módulo.

#### Scenario: Endpoints presentes e autenticados

- **WHEN** `dashboard.controller.ts` é inspecionado
- **THEN** existem handlers para os três endpoints de leitura
- **AND** nenhum deles está marcado como `@Public()`
- **AND** não existe nenhum handler de `POST`, `PUT` ou `DELETE`

#### Scenario: `GET /dashboard/summary` retorna estoque e pedidos juntos

- **WHEN** `GET /dashboard/summary` é chamado
- **THEN** a resposta contém `{ stock: { totalQuantity }, orders: { totalOrders, totalRevenue } }`

#### Scenario: `GET /dashboard/critical-stock` respeita o limite de 5

- **WHEN** `GET /dashboard/critical-stock` é chamado e existem mais de 5 produtos com `quantity === 1`
- **THEN** a resposta contém no máximo 5 itens

#### Scenario: `GET /dashboard/orders-by-period` valida a granularidade

- **WHEN** `GET /dashboard/orders-by-period` é chamado com `granularity` fora de `day`/`week`/`month`
- **THEN** o backend responde `422` com erro de validação correspondente

#### Scenario: Acesso não autenticado bloqueado

- **WHEN** uma requisição sem JWT chega em qualquer endpoint de `/dashboard`
- **THEN** o backend responde com `401`

### Requirement: Registro no módulo Nest

O `DashboardController` e o repositório Prisma SHALL ser registrados num `DashboardModule` novo, importado pelo `AppModule`, reutilizando `PrismaProductRepository` (do `CatalogModule`) para o enriquecimento de `productName` em `getCriticalStock`.

#### Scenario: Módulo registrado

- **WHEN** a aplicação backend é inicializada
- **THEN** `DashboardModule` aparece na árvore de módulos do Nest, sem erro de resolução de dependência

### Requirement: Cobertura HTTP em `dashboard.integration.http`

O backend SHALL incluir `apps/backend/src/modules/dashboard/dashboard.integration.http` (Rest Client) cobrindo: resumo com dados existentes, estoque crítico respeitando o limite de 5, série por dia/semana/mês, granularidade inválida (422), acesso sem JWT (401) em todos os três endpoints.

#### Scenario: Cenários de sucesso e erro presentes

- **WHEN** `dashboard.integration.http` é inspecionado
- **THEN** existem cenários dos três endpoints com dados válidos
- **AND** existe cenário de granularidade inválida e de acesso sem JWT
