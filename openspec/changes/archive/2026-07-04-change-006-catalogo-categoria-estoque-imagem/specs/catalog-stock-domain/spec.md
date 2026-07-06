# catalog-stock-domain Specification

## Purpose
TBD - created by change-006-catalogo-categoria-estoque-imagem. Update Purpose after archive.

## Requirements

### Requirement: Agregado `stock` no módulo `catalog`

O módulo `catalog` SHALL incluir o agregado `stock` com a estrutura padrão de pastas para entidade, repositório e casos de uso.

#### Scenario: Estrutura do agregado presente

- **WHEN** o módulo `catalog` é inspecionado após esta change
- **THEN** existe o agregado `stock` com a estrutura padrão (entidade, repositório, casos de uso)

### Requirement: Entidade `Stock` validada

O agregado `stock` SHALL definir a entidade `Stock` com os campos `productId` (string, required, formato uuid) e `quantity` (number, required, inteiro, min-value 0). A relação com `product` é 1:1 — cada `productId` corresponde a no máximo um registro de `stock`.

#### Scenario: Criação com dados válidos

- **WHEN** uma entidade `Stock` é instanciada com `productId` e `quantity` válidos
- **THEN** a entidade é criada sem erros

#### Scenario: Validação de `productId`

- **WHEN** `Stock` é instanciada com `productId` ausente ou fora do formato uuid
- **THEN** a criação falha com erro de validação correspondente

#### Scenario: Validação de `quantity`

- **WHEN** `Stock` é instanciada com `quantity` ausente, negativa ou não inteira
- **THEN** a criação falha com erro de validação correspondente

### Requirement: Contrato do repositório de `stock`

O agregado `stock` SHALL expor uma interface de repositório no módulo `catalog` cobrindo as operações necessárias para o CRUD completo: persistir (criar/atualizar), excluir por id, buscar por id e listar paginado. Esta interface NÃO PODE ser alterada por implementações técnicas. Todas as operações são expostas via HTTP (ver `catalog-stock-backend`).

#### Scenario: Contrato cobre operações do CRUD

- **WHEN** o contrato é inspecionado
- **THEN** ele expõe operações para persistir, excluir por id, buscar por id e listar paginado

### Requirement: Caso de uso `save-stock` (criar/atualizar)

O agregado `stock` SHALL implementar o caso de uso `save-stock`, retornando `void`, com decisão entre criar e atualizar baseada em `findById`: se `id` vier na entrada e `findById` retornar um registro, atualiza; caso contrário (sem `id` ou registro não encontrado), cria usando o `id` recebido ou gerando um novo.

#### Scenario: Criação sem `id`

- **WHEN** `save-stock` é chamado sem `id`, com `productId` e `quantity`
- **THEN** uma nova entidade é criada com `id` gerado e persistida

#### Scenario: Atualização de quantidade

- **WHEN** `save-stock` é chamado com `id` existente e nova `quantity`
- **THEN** a quantidade é atualizada e persistida

### Requirement: Caso de uso `delete-stock`

O agregado `stock` SHALL implementar o caso de uso `delete-stock`, retornando `void`. Quando o `id` informado não existir, SHALL lançar `DomainError("stock.not_found", 404)`.

#### Scenario: Exclusão de estoque existente

- **WHEN** `delete-stock` é chamado com `id` existente
- **THEN** o registro de estoque é removido do repositório

#### Scenario: Estoque inexistente

- **WHEN** `delete-stock` é chamado com `id` inexistente
- **THEN** o caso de uso lança `DomainError("stock.not_found", 404)`
- **AND** nada é alterado no repositório

### Requirement: Cobertura por testes unitários

Os casos de uso `save-stock` e `delete-stock` SHALL ter cobertura por testes unitários usando os fakes do módulo (`FakeStockRepository` e demais providers necessários). Cenários mínimos: criação sem id, atualização de quantidade, exclusão de estoque existente, exclusão de estoque inexistente, validações principais (`productId` inválido, `quantity` negativa ou não inteira).

#### Scenario: Cenários presentes nos testes

- **WHEN** os testes unitários dos casos de uso são executados
- **THEN** os cenários listados acima estão presentes
