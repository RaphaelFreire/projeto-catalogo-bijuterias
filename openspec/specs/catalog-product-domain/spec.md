# catalog-product-domain Specification

## Purpose
TBD - created by archiving change change-005-cadastro-produto. Extended by change-006-catalogo-categoria-estoque-imagem (categoria e imagens) e change-007-vitrine-publica-whatsapp (renomeação dos flags booleanos para propósito de marketing). Update Purpose after archive.

## Requirements

### Requirement: Agregado `product` no módulo `catalog`

O módulo `catalog` SHALL incluir o agregado `product` com a estrutura padrão de pastas para entidade, repositório, providers (se necessário) e casos de uso.

#### Scenario: Estrutura do agregado presente

- **WHEN** o módulo `catalog` é inspecionado após esta change
- **THEN** existe o agregado `product` com a estrutura padrão (entidade, repositório, casos de uso)

### Requirement: Entidade `Product` validada

O agregado `product` SHALL definir a entidade `Product` com os campos validados conforme abaixo. Os campos `bestSeller`, `dailyDeal` e `lastUnits` SHALL assumir `false` como valor default na criação quando ausentes na entrada — são selos de marketing independentes entre si, sem relação com disponibilidade real de estoque (que é responsabilidade do agregado `stock`). Os campos `description` e `categoryId` SHALL ser opcionais e persistidos como `null` quando ausentes. O campo `images` SHALL assumir lista vazia (`[]`) como valor default na criação quando ausente.

| Campo             | Tipo                                | Regras                                          |
| ----------------- | ------------------------------------ | ------------------------------------------------ |
| `name`            | string                              | required, min-length 2, max-length 120          |
| `description`     | string \| null                      | max-length 500, opcional → `null` quando ausente |
| `price`           | number                              | required, min-value 0, precision 2              |
| `status`          | `'active' \| 'inactive' \| 'draft'` | required, in `active|inactive|draft`            |
| `bestSeller`      | boolean                             | default `false` na criação — selo "Mais vendido" |
| `dailyDeal`       | boolean                             | default `false` na criação — selo "Oferta do dia" |
| `lastUnits`       | boolean                             | default `false` na criação — selo "Últimas unidades" |
| `categoryId`      | string \| null                      | opcional, formato uuid quando informado → `null` quando ausente — referência a `category` |
| `images`          | string[]                            | opcional, default `[]`, máximo de itens (`MaxItemsRule`), cada item validado como URL (`UrlRule`) |

**Nota de renomeação:** os campos `bestSeller`, `dailyDeal` e `lastUnits` correspondem, estrutural e comportamentalmente, aos antigos `availableOnline`, `featured` e `allowsPreOrder` (introduzidos na change-005) — mesmos booleanos independentes com default `false`, apenas renomeados e ressignificados de "disponibilidade" para "selos de marketing exibidos na vitrine pública" (change-007).

#### Scenario: Criação com dados válidos

- **WHEN** uma entidade `Product` é instanciada com `name`, `price`, `status` válidos e demais campos opcionais omitidos
- **THEN** a entidade é criada sem erros
- **AND** `bestSeller`, `dailyDeal` e `lastUnits` valem `false`
- **AND** `description` vale `null`
- **AND** `categoryId` vale `null`
- **AND** `images` vale `[]`

#### Scenario: Criação com categoria informada

- **WHEN** uma entidade `Product` é instanciada com `categoryId` no formato uuid válido
- **THEN** a entidade é criada sem erros com `categoryId` preenchido

#### Scenario: Validação de nome

- **WHEN** `Product` é instanciado com `name` ausente, com menos de 2 caracteres ou com mais de 120 caracteres
- **THEN** a criação falha com erro de validação correspondente

#### Scenario: Validação de descrição

- **WHEN** `Product` é instanciado com `description` acima de 500 caracteres
- **THEN** a criação falha com erro de validação correspondente

#### Scenario: Validação de preço

- **WHEN** `Product` é instanciado com `price` negativo ou com mais de 2 casas decimais
- **THEN** a criação falha com erro de validação correspondente

#### Scenario: Validação de status

- **WHEN** `Product` é instanciado com `status` fora de `active|inactive|draft`
- **THEN** a criação falha com erro de validação correspondente

#### Scenario: Validação de `categoryId`

- **WHEN** `Product` é instanciado com `categoryId` informado, mas fora do formato uuid
- **THEN** a criação falha com erro de validação correspondente
- **WHEN** `Product` é instanciado sem `categoryId`
- **THEN** a criação não falha por causa deste campo — `categoryId` vale `null`

#### Scenario: Validação de `images`

- **WHEN** `Product` é instanciado com `images` excedendo o limite máximo de itens, ou contendo algum item que não é uma URL válida
- **THEN** a criação falha com erro de validação correspondente

### Requirement: Tipo `ProductStatus` exposto no agregado

O agregado `product` SHALL expor o tipo (alias) `ProductStatus = 'active' | 'inactive' | 'draft'` para reuso por casos de uso, controller e UI.

#### Scenario: Tipo disponível para consumidores

- **WHEN** o agregado `product` é importado
- **THEN** o tipo `ProductStatus` está disponível como export

### Requirement: Contrato do repositório de `product`

O agregado `product` SHALL expor uma interface de repositório no módulo `catalog` cobrindo as operações necessárias para o CRUD: persistir (criar/atualizar), excluir por id, buscar por id e listar paginado. Esta interface NÃO PODE ser alterada por implementações técnicas.

#### Scenario: Contrato cobre operações do CRUD

- **WHEN** o contrato é inspecionado
- **THEN** ele expõe operações para persistir, excluir por id, buscar por id e listar paginado

### Requirement: Caso de uso `save-product` (criar/atualizar)

O agregado `product` SHALL implementar o caso de uso `save-product`, retornando `void`, com decisão entre criar e atualizar baseada em `findById`: se `id` vier na entrada e `findById` retornar um registro, atualiza; caso contrário (sem `id` ou registro não encontrado), cria usando o `id` recebido ou gerando um novo.

#### Scenario: Criação sem `id`

- **WHEN** `save-product` é chamado sem `id`
- **THEN** uma nova entidade é criada com `id` gerado e persistida

#### Scenario: Criação com `id` enviado e registro inexistente

- **WHEN** `save-product` é chamado com `id` que não existe no repositório
- **THEN** uma nova entidade é criada com o `id` recebido e persistida

#### Scenario: Atualização

- **WHEN** `save-product` é chamado com `id` existente
- **THEN** os campos do produto são atualizados e persistidos

### Requirement: Caso de uso `delete-product`

O agregado `product` SHALL implementar o caso de uso `delete-product`, retornando `void`. Quando o `id` informado não existir, SHALL lançar `DomainError("product.not_found", 404)`.

#### Scenario: Exclusão de produto existente

- **WHEN** `delete-product` é chamado com `id` existente
- **THEN** o produto é removido do repositório

#### Scenario: Produto inexistente

- **WHEN** `delete-product` é chamado com `id` inexistente
- **THEN** o caso de uso lança `DomainError("product.not_found", 404)`
- **AND** nada é alterado no repositório

### Requirement: Cobertura por testes unitários

Os casos de uso `save-product` e `delete-product` SHALL ter cobertura por testes unitários usando os fakes do módulo (`FakeProductRepository` e demais providers necessários). Cenários mínimos: criação sem id, criação com id, atualização, exclusão de produto existente, exclusão de produto inexistente, validações principais (nome inválido, preço negativo, status fora do enum, `categoryId` com formato inválido quando informado, `images` excedendo o limite ou com URL inválida).

#### Scenario: Cenários presentes nos testes

- **WHEN** os testes unitários dos casos de uso são executados
- **THEN** os cenários listados acima estão presentes
