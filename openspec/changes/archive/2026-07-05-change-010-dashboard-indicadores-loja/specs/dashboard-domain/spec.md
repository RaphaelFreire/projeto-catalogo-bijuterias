# dashboard-domain Specification

## Purpose
TBD - created by change-010-dashboard-indicadores-loja. Update Purpose after archive.

## Requirements

### Requirement: Módulo `dashboard` somente-leitura, sem entidade

O projeto SHALL incluir um módulo de domínio novo `dashboard` (`modules/dashboard`), expondo um contrato de repositório `DashboardRepository` com métodos de consulta agregada. Este módulo NÃO PODE definir uma entidade mutável (sem `Entity`/`EntityState`, sem `validate()`) nem casos de uso de escrita (`save-X`/`create-X`/`delete-X`) — é inteiramente somente-leitura sobre dados de outros agregados (`Order`, `Stock`, `Product`).

#### Scenario: Estrutura do módulo presente

- **WHEN** o módulo `dashboard` é inspecionado
- **THEN** existe um contrato `DashboardRepository` exportado
- **AND** não existe nenhuma entidade, nem caso de uso de escrita, neste módulo

### Requirement: Contrato do repositório com quatro consultas agregadas

`DashboardRepository` SHALL expor: `getStockSummary(): Promise<StockSummary>` (soma da quantidade em estoque de todos os produtos), `getOrderSummary(): Promise<OrderSummary>` (contagem total de pedidos e soma do faturamento), `getCriticalStock(limit: number): Promise<CriticalStockItem[]>` (produtos com `quantity` exatamente igual a 1, até `limit` itens), e `getOrdersByPeriod(granularity: 'day' | 'week' | 'month', from: Date, to: Date): Promise<OrdersByPeriodPoint[]>` (contagem e faturamento de pedidos agrupados por período).

#### Scenario: Contrato expõe as quatro consultas

- **WHEN** o contrato `DashboardRepository` é inspecionado
- **THEN** ele expõe `getStockSummary`, `getOrderSummary`, `getCriticalStock` e `getOrdersByPeriod`
- **AND** nenhum desses métodos aceita parâmetros de escrita/mutação

### Requirement: Tipos de resumo exportados pelo módulo

O módulo `dashboard` SHALL exportar os tipos `StockSummary { totalQuantity: number }`, `OrderSummary { totalOrders: number; totalRevenue: number }`, `CriticalStockItem { productId: string; productName: string | null; quantity: number }` e `OrdersByPeriodPoint { periodStart: Date; orderCount: number; revenue: number }`.

#### Scenario: Tipos presentes e com os campos esperados

- **WHEN** os tipos exportados pelo módulo `dashboard` são inspecionados
- **THEN** cada um contém exatamente os campos listados acima

### Requirement: `getCriticalStock` filtra por `quantity` exatamente 1

`getCriticalStock` SHALL retornar apenas produtos cujo estoque tem `quantity` exatamente igual a `1` — produtos com `quantity: 0` (esgotado) ou `quantity >= 2` NÃO PODEM aparecer nesta lista.

#### Scenario: Apenas quantidade igual a 1

- **WHEN** `getCriticalStock` é chamado
- **THEN** todo item retornado tem `quantity === 1`
- **AND** produtos com `quantity: 0` ou `quantity >= 2` não aparecem
