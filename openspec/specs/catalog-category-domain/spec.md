# catalog-category-domain Specification

## Purpose
TBD - created by change-006-catalogo-categoria-estoque-imagem. Update Purpose after archive.

## Requirements

### Requirement: Agregado `category` no módulo `catalog`

O módulo `catalog` SHALL incluir o agregado `category` com a estrutura padrão de pastas para entidade, repositório e casos de uso.

#### Scenario: Estrutura do agregado presente

- **WHEN** o módulo `catalog` é inspecionado após esta change
- **THEN** existe o agregado `category` com a estrutura padrão (entidade, repositório, casos de uso)

### Requirement: Entidade `Category` validada

O agregado `category` SHALL definir a entidade `Category` com o campo `name` (string, required, min-length 2, max-length 120).

#### Scenario: Criação com dados válidos

- **WHEN** uma entidade `Category` é instanciada com `name` válido
- **THEN** a entidade é criada sem erros

#### Scenario: Validação de nome

- **WHEN** `Category` é instanciada com `name` ausente, com menos de 2 caracteres ou com mais de 120 caracteres
- **THEN** a criação falha com erro de validação correspondente

### Requirement: Contrato do repositório de `category`

O agregado `category` SHALL expor uma interface de repositório no módulo `catalog` cobrindo as operações necessárias para o CRUD: persistir (criar/atualizar), excluir por id, buscar por id e listar paginado. Esta interface NÃO PODE ser alterada por implementações técnicas.

#### Scenario: Contrato cobre operações do CRUD

- **WHEN** o contrato é inspecionado
- **THEN** ele expõe operações para persistir, excluir por id, buscar por id e listar paginado

### Requirement: Caso de uso `save-category` (criar/atualizar)

O agregado `category` SHALL implementar o caso de uso `save-category`, retornando `void`, com decisão entre criar e atualizar baseada em `findById`: se `id` vier na entrada e `findById` retornar um registro, atualiza; caso contrário (sem `id` ou registro não encontrado), cria usando o `id` recebido ou gerando um novo.

#### Scenario: Criação sem `id`

- **WHEN** `save-category` é chamado sem `id`
- **THEN** uma nova entidade é criada com `id` gerado e persistida

#### Scenario: Criação com `id` enviado e registro inexistente

- **WHEN** `save-category` é chamado com `id` que não existe no repositório
- **THEN** uma nova entidade é criada com o `id` recebido e persistida

#### Scenario: Atualização

- **WHEN** `save-category` é chamado com `id` existente
- **THEN** os campos da categoria são atualizados e persistidos

### Requirement: Caso de uso `delete-category`

O agregado `category` SHALL implementar o caso de uso `delete-category`, retornando `void`. Quando o `id` informado não existir, SHALL lançar `DomainError("category.not_found", 404)`.

#### Scenario: Exclusão de categoria existente

- **WHEN** `delete-category` é chamado com `id` existente
- **THEN** a categoria é removida do repositório

#### Scenario: Categoria inexistente

- **WHEN** `delete-category` é chamado com `id` inexistente
- **THEN** o caso de uso lança `DomainError("category.not_found", 404)`
- **AND** nada é alterado no repositório

### Requirement: Cobertura por testes unitários

Os casos de uso `save-category` e `delete-category` SHALL ter cobertura por testes unitários usando os fakes do módulo (`FakeCategoryRepository` e demais providers necessários). Cenários mínimos: criação sem id, criação com id, atualização, exclusão de categoria existente, exclusão de categoria inexistente, validação de nome inválido.

#### Scenario: Cenários presentes nos testes

- **WHEN** os testes unitários dos casos de uso são executados
- **THEN** os cenários listados acima estão presentes
