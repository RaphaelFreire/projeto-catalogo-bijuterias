# catalog-order-backend Specification

## Purpose
TBD - created by change-009-pedido-desconto-estoque. Update Purpose after archive.

## Requirements

### Requirement: Model Prisma de `order` sincronizado, itens como `Json`

O backend SHALL incluir o model Prisma de `order` em `apps/backend/prisma/models/catalog.model.prisma`, sincronizado com a entidade `Order`, com `code` marcado como único (`@unique`), `items` como coluna `Json`, e sem campos `updatedAt`/`deletedAt` (pedido não é atualizado nem excluído).

#### Scenario: Model sincronizado e migration aplicada

- **WHEN** o módulo `catalog` é sincronizado com o Prisma do backend
- **THEN** existe o model `order` com os campos `code` (único), `customerName`, `items` (`Json`), `total`, `createdAt`
- **AND** uma migration nomeada por módulo é gerada e aplicada

### Requirement: Repositório Prisma de `order`, com busca por código

O backend SHALL incluir uma implementação Prisma do repositório de `order` em `apps/backend/src/modules/catalog`, respeitando a interface definida no módulo `catalog` (incluindo `findByCode`), sem métodos além do contrato de domínio.

#### Scenario: Repositório implementa contrato estável

- **WHEN** o repositório Prisma de `order` é construído
- **THEN** ele fica em `apps/backend/src/modules/catalog/order/order.prisma.ts`
- **AND** implementa a interface do módulo `catalog` sem alterá-la
- **AND** está registrado no módulo Nest com `DbModule` e `PrismaService`

### Requirement: `POST /storefront/checkout` desconta estoque e cria o pedido numa única transação

O backend SHALL expor `POST /storefront/checkout` (`@Public()`) no `StorefrontController`, recebendo `{ customerName, items: [{ productId, quantity }] }`. Dentro de uma transação Prisma interativa, para cada item o backend SHALL: resolver o produto associado (nome e preço atuais) e chamar `StockRepository.decrementIfAvailable(productId, quantity)`. Se **qualquer** item retornar `false` (estoque insuficiente), a transação inteira SHALL ser abortada — nenhum estoque é alterado e nenhum pedido é criado — e o endpoint SHALL responder `422` com `{ errors: ["order.stock.insufficient"], insufficientItems: [{ productId }] }`. Se todos os itens tiverem estoque suficiente, o backend SHALL instanciar `CreateOrder` com os itens já contendo nome/preço daquele momento, persistir o pedido na mesma transação, e responder `201` com `{ code }`.

#### Scenario: Checkout bem-sucedido desconta estoque e cria o pedido

- **WHEN** `POST /storefront/checkout` é chamado com itens que têm estoque suficiente
- **THEN** o estoque de cada produto é decrementado pela quantidade correspondente
- **AND** um pedido é criado com os itens (nome/preço no momento da compra) e um `code` novo
- **AND** a resposta é `201` com `{ code }`

#### Scenario: Checkout rejeitado não altera nada

- **WHEN** `POST /storefront/checkout` é chamado e ao menos um item não tem estoque suficiente
- **THEN** a resposta é `422` com `errors` incluindo `order.stock.insufficient` e `insufficientItems` listando os itens problemáticos
- **AND** nenhum estoque é alterado (nem dos itens que teriam estoque suficiente)
- **AND** nenhum pedido é criado

#### Scenario: Concorrência na última unidade

- **WHEN** dois checkouts concorrentes disputam a última unidade em estoque do mesmo produto
- **THEN** no máximo um deles é bem-sucedido; o outro recebe `422` com `order.stock.insufficient` para aquele item

### Requirement: `GET /storefront/orders/:code` é público

O backend SHALL expor `GET /storefront/orders/:code` (`@Public()`) no `StorefrontController`, retornando `{ code, customerName, items, total, createdAt }` do pedido correspondente, ou `404` (`order.not_found`) se o código não existir.

#### Scenario: Consulta por código existente

- **WHEN** `GET /storefront/orders/:code` é chamado com um código que existe
- **THEN** o backend responde com os dados do pedido, sem exigir autenticação

#### Scenario: Consulta por código inexistente

- **WHEN** `GET /storefront/orders/:code` é chamado com um código que não existe
- **THEN** o backend responde `404` com `errors` incluindo `order.not_found`

### Requirement: `OrderController` (admin) autenticado e somente leitura

O backend SHALL incluir `apps/backend/src/modules/catalog/order/order.controller.ts` expondo **apenas** `GET /orders` (paginado) e `GET /orders/:id`, ambos autenticados. O controller NÃO PODE expor `POST`, `PUT` nem `DELETE` — pedidos só nascem pelo checkout público.

#### Scenario: Apenas leitura exposta, autenticada

- **WHEN** `order.controller.ts` é inspecionado
- **THEN** existem apenas handlers de leitura (`GET /orders`, `GET /orders/:id`)
- **AND** nenhum deles está marcado como `@Public()`

#### Scenario: Acesso não autenticado bloqueado

- **WHEN** uma requisição sem JWT chega em `/orders`
- **THEN** o backend responde com `401`

### Requirement: Cobertura HTTP

O backend SHALL incluir cenários de Rest Client cobrindo: checkout bem-sucedido (verificando desconto de estoque e criação do pedido), checkout rejeitado por estoque insuficiente (verificando que nada foi alterado), consulta pública por código existente e inexistente, listagem paginada de pedidos no admin, obtenção de pedido por id no admin, acesso sem JWT em `/orders` (`401`), acesso sem JWT em `/storefront/checkout` e `/storefront/orders/:code` (devem funcionar, são públicos).

#### Scenario: Cenários de sucesso e erro presentes

- **WHEN** os arquivos `.integration.http` relevantes são inspecionados
- **THEN** os cenários listados acima estão presentes
