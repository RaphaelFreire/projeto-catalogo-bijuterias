## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Why

Hoje o checkout da vitrine (change-007) não toca o backend: monta uma mensagem de texto e abre o WhatsApp, sem descontar estoque nem deixar qualquer registro de que uma venda aconteceu. Isso significa que o lojista não tem como saber quanto vendeu, o estoque exibido no admin fica sempre desatualizado em relação ao que já foi "vendido" pelo WhatsApp, e o cliente não tem nenhuma confirmação além da própria mensagem que ele mesmo enviou. Esta change introduz o agregado `order`, faz o checkout descontar o estoque de forma atômica (resistente a concorrência) e disponibiliza o pedido tanto para o lojista (tela admin) quanto para o cliente (consulta pública por código, sem precisar de conta).

## What Changes

- Adicionar à interface de domínio `StockRepository` o método `decrementIfAvailable(productId, quantity)`, implementado no Prisma como uma atualização condicional atômica (`UPDATE ... WHERE quantity >= X`), evitando estoque negativo sob concorrência.
- Criar o agregado `order` no módulo `catalog`: `id`, `code` (código curto público, gerado no backend), `customerName`, `items` (lista de `{ productId, name, price, quantity }` — nome e preço **congelados no momento da compra**, não uma referência viva ao produto), `total`, `createdAt`. Casos de uso: `create-order` (a única forma de um pedido nascer — não há `save`/atualização manual) e consultas (`find-by-id`, `find-by-code`, `find-page`, via repositório direto).
- Expor `POST /storefront/checkout` (público) no `StorefrontController` já existente: recebe `customerName` e os itens do carrinho, executa numa transação — para cada item, tenta descontar o estoque condicionalmente; se qualquer item não tiver estoque suficiente, cancela a transação inteira (nada é descontado, nenhum pedido é criado) e retorna quais itens ficaram sem estoque suficiente. Se todos os descontos funcionarem, cria o `order` na mesma transação e retorna `{ code }`.
- Expor `GET /storefront/orders/:code` (público) no `StorefrontController`, para o cliente consultar seu pedido pelo código, sem autenticação.
- Criar `OrderController` (autenticado, só leitura) expondo `GET /orders` (paginado) e `GET /orders/:id` para o admin.
- Criar tela admin "Pedidos" (listagem paginada + detalhe), item novo no menu lateral.
- Criar rota pública nova no frontend (`/pedido/[codigo]`), fora do grupo `(private)`, exibindo o resumo do pedido (itens, total, nome do cliente, data) buscado por `GET /storefront/orders/:code`.
- Atualizar o fluxo de checkout da vitrine: ao finalizar, chama `POST /storefront/checkout` antes de abrir o WhatsApp; se houver item sem estoque suficiente, exibe o erro e mantém o carrinho (não abre o WhatsApp, não limpa o carrinho); se der certo, inclui o código do pedido e o link de consulta (`/pedido/<codigo>`) na mensagem de WhatsApp.
- Rodar `npx tsc --noEmit` em `apps/frontend` ao final e sinalizar ao usuário que a UI está pronta para conferência manual. **Sem verificação automatizada de UI nesta change.**

## Capabilities

### New Capabilities

- `catalog-order-domain`: Agregado `order` no módulo `catalog` com entidade validada (itens com nome/preço congelados), contrato de repositório, caso de uso `create-order` (único ponto de criação — sem atualização manual), cobertura unitária com fakes.
- `catalog-order-backend`: Model Prisma de `order` (itens como coluna `Json`), repositório Prisma, `POST /storefront/checkout` e `GET /storefront/orders/:code` (públicos) no `StorefrontController`, `OrderController` autenticado e somente leitura (`GET /orders`, `GET /orders/:id`) para o admin, desconto atômico de estoque via `StockRepository.decrementIfAvailable`, cobertura HTTP.
- `order-admin-frontend`: Tela admin "Pedidos" (listagem paginada, detalhe), item "Pedidos" no menu lateral, i18n complementar.

### Modified Capabilities

- `catalog-stock-domain`: `StockRepository` ganha `decrementIfAvailable(productId, quantity)` — desconto atômico condicional, sem alterar os métodos já existentes do contrato.
- `catalog-stock-backend`: `PrismaStockRepository` implementa `decrementIfAvailable` via `updateMany` condicional (`WHERE quantity >= X`), atômico no nível do banco.
- `storefront-frontend`: fluxo de checkout passa a chamar o backend antes de abrir o WhatsApp; mensagem de WhatsApp passa a incluir o código do pedido e o link de consulta; nova rota pública `/pedido/[codigo]` para o cliente consultar o pedido depois.

## Impact

- Estende o contrato de domínio `StockRepository` com `decrementIfAvailable` (implementado como atualização condicional atômica no Prisma — sem alterar os métodos já existentes).
- Adiciona ao módulo `catalog` o agregado `order` (entidade, contrato de repositório, caso de uso `create-order`, testes).
- Adiciona ao backend o model `Order` (Prisma) com migration incremental, `order.prisma.ts`, `order.controller.ts` (admin, autenticado, somente leitura), e estende `storefront.controller.ts` com `checkout` e consulta por código.
- Adiciona ao frontend a tela admin "Pedidos" e a rota pública `/pedido/[codigo]`; estende o fluxo de checkout da vitrine para chamar o backend antes do WhatsApp.
- Introduz a primeira transação com múltiplos passos condicionais do projeto (desconto de estoque + criação de pedido, tudo ou nada) — precedente reaproveitável por futuras operações que precisem da mesma garantia.
- **Não introduz** status de pedido (pendente/concluído/cancelado), pagamento, nem edição/cancelamento de pedido pelo admin — pedido é somente-leitura após criado (ver Non-Goals no design.md).
