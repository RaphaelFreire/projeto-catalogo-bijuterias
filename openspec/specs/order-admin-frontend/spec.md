# order-admin-frontend Specification

## Purpose
TBD - created by change-009-pedido-desconto-estoque. Update Purpose after archive.

## Requirements

### Requirement: Listagem paginada de pedidos, somente leitura

O frontend SHALL incluir uma página de listagem paginada de pedidos em rota privada, com as colunas código, nome do cliente, total e data. A listagem NÃO PODE ter ações de criar, editar ou excluir — pedidos são somente leitura no admin.

#### Scenario: Listagem renderiza pedidos

- **WHEN** a página de listagem de pedidos é acessada por um usuário autenticado
- **THEN** a tabela exibe código, nome do cliente, total e data de cada pedido, vindos de `GET /orders`

#### Scenario: Sem ações de escrita

- **WHEN** a página de listagem de pedidos é renderizada
- **THEN** não existe botão de criar novo pedido, nem ícone de editar ou excluir nas linhas

### Requirement: Detalhe do pedido

O frontend SHALL incluir uma tela de detalhe do pedido, acessível a partir da listagem, exibindo: código, nome do cliente, data, lista de itens (nome, quantidade, preço no momento da compra) e total.

#### Scenario: Detalhe exibe os itens congelados

- **WHEN** a tela de detalhe de um pedido é acessada
- **THEN** os itens exibidos mostram o nome e o preço registrados no momento da compra (não o nome/preço atual do produto, caso tenham mudado desde então)

### Requirement: Item "Pedidos" no menu lateral

A sidebar de navegação SHALL incluir um item "Pedidos" apontando para a listagem.

#### Scenario: Item visível na sidebar

- **WHEN** uma página do grupo `(private)` é renderizada
- **THEN** a sidebar contém um item "Pedidos"

### Requirement: Chaves novas no i18n

O frontend SHALL adicionar em `messages.pt.ts` e `messages.en.ts` a chave `order.not_found`, reaproveitando chaves já cadastradas quando aplicável.

#### Scenario: Mensagem presente

- **WHEN** os arquivos de i18n são inspecionados
- **THEN** existe a chave `order.not_found` em pt e en

### Requirement: Verificação de tipos do frontend e conferência manual

O processo de implementação SHALL executar `npx tsc --noEmit` em `apps/frontend` ao fim das mudanças e sinalizar ao usuário que a UI está pronta para conferência manual. Esta change NÃO PODE acionar verificação automatizada de UI.

#### Scenario: TypeScript limpo

- **WHEN** `npx tsc --noEmit` é executado em `apps/frontend`
- **THEN** o comando termina sem erros novos introduzidos por esta change
