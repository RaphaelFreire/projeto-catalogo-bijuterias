## Instruções Compartilhadas

Estas instruções valem para qualquer change deste projeto e devem ser respeitadas durante a execução das tasks abaixo:

- [Como executar](../../shared/como-executar.md) — regras de execução e formato de evidência por task.
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md) — convenções de nomes de arquivos e diretórios.

## 1. Negócio — módulo `dashboard` (somente-leitura, sem entidade)

- [x] 1.1 Criar a estrutura mínima do módulo `dashboard` em `modules/dashboard` (sem usar a skill [module-aggregate](../../../.claude/skills/module-aggregate), que assume uma entidade — este módulo não tem uma). Estrutura: `src/index.ts`, `src/provider/dashboard.repository.ts`, `src/model/index.ts` (ou arquivo equivalente) só com os tipos de resumo.
  > ✅ 2026-07-05 — Estrutura criada manualmente (a skill module-aggregate pressupõe entidade, e module-repository pede uma entidade principal, o que não se aplica aqui). Sem pasta `test/` — não há caso de uso nem entidade para testar unitariamente; a cobertura real fica no `.http` de integração do backend (task 3.4).
- [x] 1.2 Definir os tipos `StockSummary { totalQuantity: number }`, `OrderSummary { totalOrders: number; totalRevenue: number }`, `CriticalStockItem { productId: string; productName: string | null; quantity: number }` e `OrdersByPeriodPoint { periodStart: Date; orderCount: number; revenue: number }`, e o tipo `PeriodGranularity = 'day' | 'week' | 'month'`.
  > ✅ 2026-07-05 — `src/model/dashboard-summary.model.ts`, exatamente com os campos listados.
- [x] 1.3 Definir o contrato `DashboardRepository`, expondo `getStockSummary(): Promise<StockSummary>`, `getOrderSummary(): Promise<OrderSummary>`, `getCriticalStock(limit: number): Promise<CriticalStockItem[]>` e `getOrdersByPeriod(granularity: PeriodGranularity, from: Date, to: Date): Promise<OrdersByPeriodPoint[]>`. Sem caso de uso — consultas serão chamadas diretamente do controller, mesmo padrão já usado pelos endpoints de leitura de outros agregados do projeto.
  > ✅ 2026-07-05 — `src/provider/dashboard.repository.ts`. Interface pura, sem `CrudRepository` (não é CRUD) e sem `@sdd/shared` como dependência (o módulo não usa `Entity`/`Validator`, então não precisa do pacote compartilhado).
- [x] 1.4 Adicionar `@sdd/dashboard` ao workspace (`package.json`, `tsconfig`) seguindo o mesmo padrão dos módulos já existentes (`@sdd/catalog`, `@sdd/settings`).
  > ✅ 2026-07-05 — `package.json`/`tsconfig.json` no mesmo padrão de `@sdd/settings` (sem scripts/deps de teste, já que não há nada com comportamento em runtime para testar neste módulo). `npm install` na raiz registrou o workspace; `npm run build --workspace @sdd/dashboard` ok.

## 2. Back-end — índice em `Order.createdAt`

- [x] 2.1 Adicionar `@@index([createdAt])` ao model `Order` em `apps/backend/prisma/models/catalog.model.prisma`, com a skill [backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module), gerando migration incremental. Não alterar nenhum outro campo do model.
  > ✅ 2026-07-05 — Migration `20260705130214_catalog_order_created_at_index` gerada via `npx prisma migrate dev --name catalog-order-created-at-index` e aplicada. Nenhum outro campo do model alterado. `npx prisma generate` ok.

## 3. Back-end — `dashboard`

- [x] 3.1 Implementar `PrismaDashboardRepository` em `apps/backend/src/modules/dashboard/dashboard.prisma.ts`: `getStockSummary` via `prisma.stock.aggregate({ _sum: { quantity: true } })`; `getOrderSummary` via `prisma.order.count()` e `prisma.order.aggregate({ _sum: { total: true } })`; `getCriticalStock` via `prisma.stock.findMany({ where: { quantity: 1 }, take: limit })`, resolvendo `productName` via `ProductRepository.findById` (mesmo padrão já usado em `stock.controller.ts`); `getOrdersByPeriod` via `prisma.$queryRaw` com `date_trunc('day' | 'week' | 'month', "createdAt")` do Postgres, agrupando contagem e soma de `total`, filtrando pelo intervalo `[from, to]`.
  > ✅ 2026-07-05 — `date_trunc`/`from`/`to` passados via template tag do `$queryRaw` (parametrizados pelo driver, sem concatenação de string — seguro contra SQL injection mesmo sendo query raw). Testado em runtime via curl numa instância isolada (porta 4005): `summary` retornou `{ stock: { totalQuantity: 45 }, orders: { totalOrders: 6, totalRevenue: 8351.6 } }` batendo com os dados reais do banco; `orders-by-period?granularity=day` retornou o bucket agregado corretamente.
- [x] 3.2 Criar `apps/backend/src/modules/dashboard/dashboard.controller.ts`, autenticado, expondo `GET /dashboard/summary`, `GET /dashboard/critical-stock` (query `limit`, default 5) e `GET /dashboard/orders-by-period` (query `granularity`, `from`, `to` — validar `granularity` contra `day`/`week`/`month`, `422` `dashboard.granularity.invalid` caso contrário ou ausente).
  > ✅ 2026-07-05 — Quando `from`/`to` não são informados, o controller aplica um intervalo padrão terminando em "agora" (30 dias pra trás em `day`, 12 semanas em `week`, 12 meses em `month`) — não documentado explicitamente no design.md, registrado aqui como detalhe de implementação. Testado via curl: granularidade inválida e ausente retornam `422 dashboard.granularity.invalid`; sem JWT retorna `401` nos três endpoints.
- [x] 3.3 Criar `DashboardModule` registrando `DashboardController` e `PrismaDashboardRepository`, importando `CatalogModule` para o enriquecimento de `productName` em `getCriticalStock` (via `PrismaProductRepository`, já exportado por `CatalogModule`). Registrar `DashboardModule` no `AppModule`.
  > ✅ 2026-07-05 — Testado em runtime: app sobe sem erro de resolução de dependência, criei um produto com `quantity: 1` e confirmei que `GET /dashboard/critical-stock` retornou `{ productId, productName: "Produto Estoque Critico", quantity: 1 }` corretamente enriquecido.
- [x] 3.4 Criar `apps/backend/src/modules/dashboard/dashboard.integration.http` cobrindo: resumo com dados existentes, estoque crítico (com e sem `limit`), série por dia/semana/mês, intervalo explícito, granularidade inválida e ausente (422), acesso sem JWT nos três endpoints (401).
  > ✅ 2026-07-05 — Todos os cenários criados e validados manualmente via curl durante a implementação (evidência acima).

## 4. Front-end — página `/dashboard`

- [x] 4.1 Criar `dashboard-api.util.ts` no módulo `dashboard` do frontend (`listDashboardSummary`, `listCriticalStock`, `listOrdersByPeriod`).
  > ✅ 2026-07-05 — `getDashboardSummary`, `listCriticalStock`, `listOrdersByPeriod` (mesmo padrão de `authHeaders()`/`parseError` já usado em `stock-api.util.ts`).
- [x] 4.2 Criar a página `/dashboard` (rota privada) com os três `MetricCard` (estoque total, total de pedidos, faturamento) carregados de `GET /dashboard/summary`.
  > ✅ 2026-07-05 — `apps/frontend/src/app/(private)/dashboard/page.tsx` → `modules/dashboard/pages/dashboard.page.tsx` → `dashboard.component.tsx`.
- [x] 4.3 Adicionar a seção de estoque crítico: lista simples (sem cor/ícone de alerta) com até 5 itens de `GET /dashboard/critical-stock`, com estado vazio quando não houver nenhum.
  > ✅ 2026-07-04 — Lista simples (nome + quantidade), `EmptyListState` reaproveitado quando vazia.
- [x] 4.4 Adicionar o gráfico de pedidos por período, reaproveitando `ComposedBarLineChart` (ou componente equivalente já existente), com um seletor de granularidade (dia/semana/mês) que recarrega `GET /dashboard/orders-by-period` ao trocar.
  > ✅ 2026-07-05 — `ComposedBarLineChart` ganhou props novas (`onBarClick`, `selectedIndex`, `selectedBarColor`), opcionais e sem quebrar nenhum uso existente (não havia nenhum outro consumidor do componente até agora). Barra = contagem de pedidos, linha = faturamento.
- [x] 4.5 Implementar o clique num ponto/barra do gráfico abrindo um resumo (quantidade de pedidos, faturamento, ticket médio calculado no cliente) usando somente os dados já carregados daquele ponto, sem chamada nova ao backend. Destacar visualmente o período selecionado.
  > ✅ 2026-07-05 — `onBarClick` só atualiza `selectedIndex` local (nenhuma requisição nova); resumo (qtd/faturamento/ticket médio) e destaque visual da barra selecionada via `<Cell>` do recharts.
- [x] 4.6 Remover o item "Dashboard" do módulo de menu "Exemplo" (`apps/frontend/src/app/(private)/layout.tsx`) e adicionar um item novo "Dashboard" apontando para `/dashboard`, em posição de destaque.
  > ✅ 2026-07-05 — Módulo "Exemplo" removido inteiramente de `APP_MODULES` (só tinha esse item, ficaria vazio) e substituído por um módulo "Dashboard" na mesma posição (primeira). `defaultModuleId` atualizado de `"example"` para `"dashboard"`.
- [x] 4.7 Remover (ou deixar de referenciar) a rota `/example/dashboard` e os componentes `EmptyDashboard`/`EmptyDashboardState`, caso não sejam usados em mais nenhum lugar do projeto.
  > ✅ 2026-07-05 — Confirmado via grep que não eram usados em mais nenhum lugar; removidos `app/(private)/example/` (diretório inteiro), `empty-dashboard.tsx` e `empty-dashboard-state.tsx`. Removida também a linha de export órfã em `shared/index.ts` (barrel) que ainda apontava para `empty-dashboard-state`.
- [x] 4.8 Acrescentar as chaves novas de i18n necessárias (ex.: validação de `granularity` inválida), reaproveitando chaves existentes.
  > ✅ 2026-07-05 — `dashboard.granularity.invalid` adicionada em `messages.pt.ts`/`messages.en.ts`.
- [x] 4.9 Rodar `npx tsc --noEmit` em `apps/backend` e `apps/frontend`, e sinalizar ao usuário que a UI está pronta para conferência manual.
  > ✅ 2026-07-05 — `npx tsc --noEmit` limpo nos dois. `npm run build` (produção) do frontend limpo — rota `/dashboard` aparece estática, `/example/dashboard` não existe mais. Confirmado também que o servidor de dev já rodando do usuário (porta 4000) recarregou o `DashboardModule` sem erro de DI (`GET /dashboard/summary` respondeu `401` em vez de `404`). **UI pronta para conferência manual do usuário** — não testado clique-a-clique em navegador (sem ferramenta de automação de browser neste ambiente).
