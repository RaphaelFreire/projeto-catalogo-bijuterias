## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Why

Hoje o lojista não tem nenhuma visão consolidada da operação — para saber quanto tem em estoque, quantos pedidos já foram feitos ou como as vendas evoluem ao longo do tempo, seria preciso navegar manualmente pelas telas de Estoque e Pedidos e somar/contar na cabeça. O único "Dashboard" que existe hoje no menu (`/example/dashboard`, dentro do módulo "Exemplo") é um placeholder estático — um SVG de exemplo com o texto "este dashboard ainda não foi implementado", nunca ligado a dados reais. Esta change substitui esse placeholder por um dashboard de verdade, com indicadores de estoque e pedidos e um gráfico interativo de pedidos por período.

## What Changes

- Criar o módulo de domínio `dashboard` (`modules/dashboard`), com um `DashboardRepository` somente-leitura (sem entidade mutável, sem `save`/`delete` — é um módulo de relatório, não de CRUD) expondo: resumo de estoque (soma de quantidade), resumo de pedidos (contagem + faturamento), lista de produtos com estoque crítico (`quantity === 1`, no máximo 5) e série de pedidos por período (dia/semana/mês) com contagem e faturamento por bucket.
- Criar o backend `dashboard`: implementação Prisma do repositório (usando `aggregate`/`count` do Prisma para somas/contagens simples, e `$queryRaw` com `date_trunc` do Postgres para o agrupamento por dia/semana/mês), `DashboardController` autenticado expondo `GET /dashboard/summary`, `GET /dashboard/critical-stock` e `GET /dashboard/orders-by-period?granularity=day|week|month&from=&to=`.
- Adicionar índice (`@@index([createdAt])`) ao model `Order` no Prisma, já que o novo endpoint de série temporal filtra e agrupa por essa coluna.
- Criar o frontend `dashboard`: página nova em `/dashboard` (rota privada), substituindo `/example/dashboard`. Reaproveita os componentes de dashboard já existentes e nunca usados com dados reais (`MetricCard`, `ComposedBarLineChart`, `Card` de lista), sem criar novos componentes de visualização do zero. Toggle dia/semana/mês sobre o gráfico; clicar numa barra abre um resumo do período (quantidade de pedidos, faturamento, ticket médio) usando os dados já carregados do bucket clicado, sem chamada nova ao backend.
- Remover o item de menu "Dashboard" do módulo "Exemplo" (que fica vazio sem ele) e adicionar um item novo "Dashboard" apontando para `/dashboard`, na posição de destaque do menu lateral.
- Atualização é **sob demanda** (carrega ao entrar na página, sem polling nem WebSocket) — decisão explícita do usuário para não introduzir infraestrutura de tempo real nesta change.

## Capabilities

### New Capabilities

- `dashboard-domain`: Módulo `dashboard` com contrato de repositório somente-leitura (`DashboardRepository`) e tipos de resumo (estoque, pedidos, estoque crítico, série por período). Sem entidade, sem casos de uso — consultas são feitas diretamente pelo repositório (mesmo padrão já usado pelos endpoints de leitura de outros controllers do projeto).
- `dashboard-backend`: Implementação Prisma do repositório, `DashboardController` autenticado com os três endpoints de leitura, cobertura HTTP em `dashboard.integration.http`.
- `dashboard-frontend`: Página `/dashboard` com os quatro indicadores (estoque total, pedidos + faturamento, lista de estoque crítico, gráfico de pedidos por período com drill-down), substituindo o placeholder de exemplo.

### Modified Capabilities

- `catalog-order-backend` (ou o model Prisma subjacente): adiciona `@@index([createdAt])` ao model `Order`, sem alterar nenhum comportamento existente de checkout/consulta.

## Impact

- Novo módulo de domínio `dashboard` (`modules/dashboard`), primeiro módulo do projeto que é puramente de leitura/relatório — sem entidade, sem `save-X`/`delete-X`. Precedente reaproveitável por futuros relatórios.
- Novo backend `dashboard` com endpoints agregados (`sum`, `count`, `groupBy` via `date_trunc`) — primeira vez que o projeto usa `$queryRaw` para agregação temporal.
- Migration incremental no model `Order` (índice em `createdAt`, sem mudança de schema visível para o domínio).
- Remove o placeholder `/example/dashboard` e o item "Dashboard" do módulo "Exemplo" no menu; adiciona rota `/dashboard` e item de menu novo.
- **Não introduz** tempo real (WebSocket/SSE/polling) — atualização é sempre sob demanda, decisão explícita para não adicionar infraestrutura nova nesta entrega.
- **Não adiciona** campo SKU ao `Product` — decisão explícita do usuário, fora do escopo desta change.
- **Não adiciona** alerta visual (cor/ícone) de estoque baixo — decisão explícita do usuário: é uma lista simples, sem destaque, limitada a 5 itens com `quantity === 1` exato (não `<= 1`).
