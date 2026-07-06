# dashboard-frontend Specification

## Purpose
TBD - created by change-010-dashboard-indicadores-loja. Update Purpose after archive.

## Requirements

### Requirement: Página `/dashboard` substitui o placeholder `/example/dashboard`

O frontend SHALL incluir uma página nova em rota privada `/dashboard`, exibindo os indicadores reais descritos nos requisitos abaixo. A rota `/example/dashboard` e o item "Dashboard" do módulo de menu "Exemplo" NÃO PODEM continuar apontando para o placeholder (`EmptyDashboard`) — o item de menu passa a apontar para `/dashboard`.

#### Scenario: Item de menu aponta para o dashboard real

- **WHEN** a sidebar de navegação é renderizada
- **THEN** existe um item "Dashboard" apontando para `/dashboard`
- **AND** este item não está mais associado ao placeholder `EmptyDashboard`

### Requirement: Cards de indicadores (estoque, pedidos, faturamento)

A página SHALL exibir, em destaque no topo, três indicadores usando o componente `MetricCard` já existente: total de itens em estoque (soma de quantidade), total de pedidos (contagem) e faturamento total (soma formatada em BRL).

#### Scenario: Indicadores carregados de `GET /dashboard/summary`

- **WHEN** a página `/dashboard` é carregada
- **THEN** os três cards exibem os valores retornados por `GET /dashboard/summary`

### Requirement: Lista de estoque crítico, sem destaque visual

A página SHALL exibir uma lista simples (sem cor de alerta, sem ícone de urgência) com até 5 produtos retornados por `GET /dashboard/critical-stock`, mostrando nome do produto e quantidade.

#### Scenario: Lista sem estoque crítico fica vazia, sem erro

- **WHEN** `GET /dashboard/critical-stock` retorna uma lista vazia
- **THEN** a seção exibe um estado vazio (ex.: "Nenhum produto com estoque crítico"), sem quebrar a página

### Requirement: Gráfico de pedidos por período, com toggle dia/semana/mês e drill-down por clique

A página SHALL exibir um gráfico (reaproveitando `ComposedBarLineChart` ou equivalente já existente) com a série de `GET /dashboard/orders-by-period`, controlado por um seletor de granularidade (dia/semana/mês) que recarrega a série ao trocar. Clicar num ponto/barra do gráfico SHALL exibir um resumo do período (quantidade de pedidos, faturamento, ticket médio) usando somente os dados já carregados naquele ponto — SEM disparar uma nova requisição ao backend.

#### Scenario: Trocar a granularidade recarrega a série

- **WHEN** o usuário troca o seletor de dia para semana (ou mês)
- **THEN** o frontend chama `GET /dashboard/orders-by-period` com o novo `granularity`
- **AND** o gráfico é atualizado com os novos buckets

#### Scenario: Clique num período abre o resumo sem nova chamada

- **WHEN** o usuário clica num ponto/barra do gráfico
- **THEN** um resumo é exibido com a quantidade de pedidos e o faturamento daquele período, e o ticket médio calculado (faturamento ÷ quantidade)
- **AND** nenhuma requisição HTTP nova é disparada por esse clique

#### Scenario: Período selecionado é destacado visualmente

- **WHEN** um ponto/barra do gráfico está selecionado
- **THEN** ele é visualmente destacado em relação aos demais

### Requirement: Chaves novas no i18n

O frontend SHALL adicionar em `messages.pt.ts` e `messages.en.ts` as chaves novas desta change (ex.: validação de `granularity` inválida), reaproveitando chaves já cadastradas quando aplicável.

#### Scenario: Mensagens presentes

- **WHEN** os arquivos de i18n são inspecionados
- **THEN** existem as chaves novas desta change em pt e en

### Requirement: Verificação de tipos do frontend e conferência manual

O processo de implementação SHALL executar `npx tsc --noEmit` em `apps/frontend` ao fim das mudanças e sinalizar ao usuário que a UI está pronta para conferência manual. Esta change NÃO PODE acionar verificação automatizada de UI.

#### Scenario: TypeScript limpo

- **WHEN** `npx tsc --noEmit` é executado em `apps/frontend`
- **THEN** o comando termina sem erros novos introduzidos por esta change
