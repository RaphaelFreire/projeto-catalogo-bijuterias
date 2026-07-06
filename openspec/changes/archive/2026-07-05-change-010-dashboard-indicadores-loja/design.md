## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Context

O admin já tem telas de Estoque (`/stock`) e Pedidos (`/orders`), ambas CRUD/somente-leitura paginadas — nenhuma delas mostra um total agregado. O único "Dashboard" existente é `/example/dashboard`, um placeholder estático (`EmptyDashboard`) dentro do módulo de menu "Exemplo", que nunca foi ligado a dados reais.

Premissas herdadas:

- `Order` (change-009): `{ id, code, customerName, items (Json), total (Decimal), createdAt }`, sem `updatedAt`/`deletedAt` — imutável após criado. `createdAt` hoje **sem índice**.
- `Stock` (change-006): `{ id, productId (unique), quantity, createdAt, updatedAt, deletedAt }` — um registro por produto.
- Já existem componentes de dashboard prontos, nunca usados com dados reais: `MetricCard` (tile de KPI genérico), `ComposedBarLineChart` (recharts, combina barra+linha), `PieBreakdownChart`, `DashboardBreakdownCard`, `DashboardRankingListCard` — todos com props genéricas, claramente construídos para este propósito.
- Nenhum endpoint de agregação existe hoje no backend — todo controller expõe apenas CRUD e `findPage` (skip/take).
- O projeto não tem nenhuma infraestrutura de tempo real (WebSocket, SSE, polling) — decisão explícita do usuário de não introduzir isso nesta change.

## Goals / Non-Goals

**Goals:**

- Mostrar, com dados reais, o total de estoque, o total de pedidos e o faturamento.
- Listar até 5 produtos com exatamente 1 unidade em estoque.
- Mostrar um gráfico de pedidos por dia/semana/mês, com drill-down por clique.
- Carregar rápido (endpoints fazem a agregação no banco, não no cliente).

**Non-Goals:**

- Tempo real (WebSocket/SSE/polling automático) — atualização é sempre sob demanda (carrega ao entrar na página).
- Campo SKU no `Product` — decisão explícita do usuário, fora de escopo.
- Alerta visual (cor/ícone) de estoque baixo — é uma lista simples, sem destaque.
- Edição de pedidos/estoque a partir do dashboard — é uma tela somente-leitura, assim como `/stock` e `/orders` já são.
- Lista de pedidos dentro do drill-down do gráfico — o resumo do período (quantidade, faturamento, ticket médio) vem inteiramente dos dados já carregados do bucket clicado; uma lista detalhada de pedidos do período fica fora desta entrega (os dados de contagem/valor já respondem à necessidade descrita).

## Decisions

### Decisão 1: `dashboard` é um módulo de domínio somente-leitura, sem entidade nem casos de uso

Ao contrário de todo módulo anterior do projeto (que sempre gira em torno de uma entidade com `save-X`/`delete-X`, ou ao menos `create-X` como `order`), `dashboard` **não tem entidade**. O `DashboardRepository` expõe diretamente métodos de consulta (`getStockSummary`, `getOrderSummary`, `getCriticalStock`, `getOrdersByPeriod`), retornando tipos simples (`StockSummary`, `OrderSummary`, `CriticalStockItem[]`, `OrdersByPeriodPoint[]`) — sem `validate()`, sem `Entity`/`EntityState`.

**Por quê:** Dashboard não representa um "objeto de negócio" que nasce, muda e é validado — é uma leitura agregada sobre dados que já existem e já são validados em seus próprios agregados (`Order`, `Stock`, `Product`). Forçar uma entidade aqui seria uma abstração vazia. Isso segue o mesmo espírito da decisão já registrada para `order` (quebra deliberada do padrão CRUD quando o domínio realmente não pede um) e do padrão já estabelecido no projeto de que "consultas chamam o repositório diretamente", sem caso de uso, quando não há regra de negócio a aplicar.

### Decisão 2: agregações simples via Prisma `aggregate`/`count`; série temporal via `$queryRaw` com `date_trunc`

`getStockSummary` usa `prisma.stock.aggregate({ _sum: { quantity: true } })`. `getOrderSummary` usa `prisma.order.count()` e `prisma.order.aggregate({ _sum: { total: true } })`. `getCriticalStock` usa `prisma.stock.findMany({ where: { quantity: 1 }, take: 5 })`, enriquecido com o nome do produto via `ProductRepository.findById` (mesmo padrão já usado em `stock.controller.ts` para resolver `productName`). `getOrdersByPeriod(granularity, from, to)` usa `prisma.$queryRaw` com `date_trunc('day' | 'week' | 'month', "createdAt")`, agrupando e somando/contando por bucket.

**Por quê:** Prisma não tem uma API nativa para "agrupar por dia/semana/mês" (seu `groupBy` só agrupa por igualdade de coluna, não por truncamento de data) — `date_trunc` do Postgres via `$queryRaw` é a forma padrão de fazer isso sem trazer todos os pedidos para o Node e agregar em memória. Isso importa porque pedidos crescem indefinidamente (ao contrário de produto/categoria, que ficam num teto pequeno) — agregar no cliente ou até no Node degradaria com o tempo. Todas as demais agregações (soma de estoque, contagem/soma de pedidos) já têm suporte nativo do Prisma, sem precisar de SQL manual.

### Decisão 3: índice em `Order.createdAt`

Adicionar `@@index([createdAt])` ao model `Order`, via migration incremental.

**Por quê:** O endpoint de série temporal filtra e agrupa por `createdAt` — sem índice, essa consulta faria um full scan da tabela de pedidos a cada carregamento do dashboard. Como o requisito técnico pede carregamento abaixo de 2 segundos, e o custo de adicionar o índice é praticamente zero, faz sentido incluir aqui em vez de esperar um problema de performance aparecer depois.

### Decisão 4: drill-down do gráfico usa só os dados já carregados do bucket — sem chamada nova ao backend

Ao clicar numa barra do gráfico, o resumo exibido (quantidade de pedidos, faturamento, ticket médio) vem inteiramente do ponto de dado (`OrdersByPeriodPoint`) que já foi carregado para desenhar aquele gráfico — nenhuma requisição adicional é disparada no clique.

**Por quê:** `GET /dashboard/orders-by-period` já retorna, por bucket, a contagem e o faturamento — exatamente os dois números que o requisito pede no resumo do clique (ticket médio é só faturamento ÷ contagem, calculável no cliente). Buscar de novo no clique seria uma chamada redundante e mais lenta para o usuário sem trazer nenhum dado novo.

### Decisão 5: toggle dia/semana/mês recarrega a série com uma nova chamada, parametrizada por `granularity`

Trocar o toggle (dia/semana/mês) dispara uma nova chamada a `GET /dashboard/orders-by-period?granularity=<...>`, em vez de o frontend buscar tudo por dia e agregar semana/mês no cliente.

**Por quê:** Mesma lógica da Decisão 2 — a agregação por `date_trunc` já acontece no banco; fazer o frontend buscar todos os dados diários (que crescem para sempre) só para agregar de novo no cliente jogaria fora a vantagem de ter um endpoint agregado.

### Decisão 6: dashboard reaproveita 100% dos componentes visuais já existentes, sem criar nenhum novo

`MetricCard` para os KPIs (estoque total, total de pedidos, faturamento), `ComposedBarLineChart` (ou `Bar`/`Line` conforme a granularidade) para a série de pedidos, um `Card` simples com lista para o estoque crítico.

**Por quê:** Esses componentes já existem, com props genéricas, e nunca foram usados com dados reais — construí-los do zero seria retrabalho. O trabalho desta change é a integração com dados reais, não desenho de UI nova.

### Decisão 7: `/example/dashboard` e o módulo "Exemplo" no menu são removidos junto com esta change

O item de menu "Dashboard" (dentro do módulo "Exemplo", que fica vazio sem ele) é substituído por um item novo "Dashboard" apontando para `/dashboard`. A rota `/example/dashboard` e o componente `EmptyDashboard`/`EmptyDashboardState` deixam de ser referenciados pelo menu.

**Por quê:** Decisão explícita do usuário — o dashboard novo **substitui** o placeholder, não convive ao lado dele.

## Risks / Trade-offs

- **Sem tempo real** — se o lojista quiser ver uma venda aparecer instantaneamente sem recarregar a página, isso não vai acontecer nesta entrega → Aceito, decisão explícita do usuário; extensão futura isolada (polling ou WebSocket) se vier a ser necessário.
- **`$queryRaw` é acoplado ao Postgres** (sintaxe de `date_trunc` não é portável para outro banco) → Aceito; o projeto já usa Postgres como banco único, sem indicação de troca futura.
- **Lista de estoque crítico limitada a 5 e a `quantity === 1` exato** — um produto com `quantity: 0` (esgotado) não aparece nessa lista, mesmo sendo "pior" que 1 → Aceito, decisão explícita do usuário; produtos esgotados já aparecem com badge "Esgotado" na vitrine e no card de produto, então não ficam sem visibilidade nenhuma.

## Migration Plan

Não há sistema em produção. Entrega incremental:

1. **Domínio**: criar módulo `dashboard` (`modules/dashboard`) com `DashboardRepository` (contrato) e os tipos de resumo — sem entidade, sem casos de uso.
2. **Backend `order` (extensão)**: adicionar `@@index([createdAt])` ao model `Order`, migration incremental.
3. **Backend `dashboard`**: implementação Prisma do repositório (`aggregate`/`count`/`$queryRaw`), `DashboardController` autenticado (`GET /dashboard/summary`, `GET /dashboard/critical-stock`, `GET /dashboard/orders-by-period`), `dashboard.integration.http`.
4. **Frontend `dashboard`**: página `/dashboard` com os quatro indicadores, reaproveitando `MetricCard`/`ComposedBarLineChart`/`Card`; remove o item "Dashboard" do módulo "Exemplo" e adiciona o item novo apontando para `/dashboard`.
5. Rodar `npx tsc --noEmit` no backend e no frontend, e sinalizar ao usuário para conferência manual.

Rollback: descartar a branch.

## Open Questions

Nenhuma. As decisões desta change cobrem a ausência de entidade no módulo `dashboard`, a estratégia de agregação (Prisma nativo + `$queryRaw` para série temporal), o escopo do drill-down (sem chamada nova ao backend), a substituição do placeholder de exemplo, e os limites explícitos definidos pelo usuário (sem SKU, sem alerta visual, sem tempo real).
