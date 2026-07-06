# catalog-order-domain Specification

## Purpose
TBD - created by change-009-pedido-desconto-estoque. Update Purpose after archive.

## Requirements

### Requirement: Agregado `order` no módulo `catalog`

O módulo `catalog` SHALL incluir o agregado `order` com a estrutura padrão de pastas para entidade, repositório e casos de uso.

#### Scenario: Estrutura do agregado presente

- **WHEN** o módulo `catalog` é inspecionado após esta change
- **THEN** existe o agregado `order` com a estrutura padrão (entidade, repositório, casos de uso)

### Requirement: Entidade `Order` com itens congelados no momento da compra

O agregado `order` SHALL definir a entidade `Order` com os campos: `code` (string, required — código curto público, gerado antes da instanciação), `customerName` (string, required, min-length 2), `items` (array, required, mínimo de 1 item; cada item com `productId` uuid, `name` string, `price` number min-value 0, `quantity` integer min-value 1) e `total` (number, required, min-value 0). Os campos `name` e `price` de cada item SHALL representar o valor do produto **no momento da compra** — a entidade NÃO faz nenhuma referência viva ao agregado `product`.

#### Scenario: Criação com dados válidos

- **WHEN** uma entidade `Order` é instanciada com `code`, `customerName`, `items` (com ao menos um item válido) e `total` consistente
- **THEN** a entidade é criada sem erros

#### Scenario: Validação de `customerName`

- **WHEN** `Order` é instanciado com `customerName` ausente ou com menos de 2 caracteres
- **THEN** a criação falha com erro de validação correspondente

#### Scenario: Validação de `items`

- **WHEN** `Order` é instanciado com `items` vazio, ou contendo algum item com `quantity` menor que 1 ou `price` negativo
- **THEN** a criação falha com erro de validação correspondente

### Requirement: Contrato do repositório de `order`, com busca por código

O agregado `order` SHALL expor uma interface de repositório no módulo `catalog` cobrindo as operações necessárias para criar, buscar por id, buscar por `code` (`findByCode`) e listar paginado. Esta interface NÃO PODE ser alterada por implementações técnicas.

#### Scenario: Contrato cobre operações necessárias

- **WHEN** o contrato é inspecionado
- **THEN** ele expõe operações para criar, buscar por id, buscar por `code` e listar paginado

### Requirement: Caso de uso `create-order`, único ponto de criação de pedido

O agregado `order` SHALL implementar o caso de uso `create-order`, recebendo `customerName` e `items` (já com `productId`/`name`/`price`/`quantity` resolvidos pelo chamador — o caso de uso não busca dados de produto). O caso de uso SHALL: calcular `total` a partir da soma de `price * quantity` de cada item; gerar um `code` curto e verificar sua unicidade via `findByCode` antes de persistir, tentando novamente (até um número pequeno de tentativas) em caso de colisão; persistir o pedido; e retornar o `code` gerado. O agregado `order` NÃO PODE expor caso de uso de atualização (`save-order`) nem de exclusão (`delete-order`) — um pedido, uma vez criado, é imutável.

#### Scenario: Criação calcula o total corretamente

- **WHEN** `create-order` é chamado com itens somando um valor conhecido
- **THEN** o pedido é persistido com `total` igual à soma de `price * quantity` de todos os itens

#### Scenario: Código gerado é único

- **WHEN** `create-order` é chamado e o código gerado já existe em outro pedido
- **THEN** o caso de uso gera um novo código e tenta novamente, até persistir com um código não utilizado

#### Scenario: Sem caso de uso de atualização ou exclusão

- **WHEN** o agregado `order` é inspecionado
- **THEN** não existe `save-order` nem `delete-order` — apenas `create-order` e consultas

### Requirement: Cobertura por testes unitários

O caso de uso `create-order` SHALL ter cobertura por testes unitários usando `FakeOrderRepository`. Cenários mínimos: criação com itens válidos calculando `total` corretamente, geração de código único (incluindo nova tentativa após colisão simulada), validação de `customerName` inválido, validação de `items` vazio ou com item inválido.

#### Scenario: Cenários presentes nos testes

- **WHEN** os testes unitários do caso de uso são executados
- **THEN** os cenários listados acima estão presentes
