# settings-domain Specification

## Purpose
TBD - created by change-007-vitrine-publica-whatsapp. Update Purpose after archive.

## Requirements

### Requirement: Agregado singleton `store-settings` no módulo `settings`

O módulo `settings` SHALL incluir o agregado `store-settings` com a estrutura padrão de pastas para entidade, repositório e casos de uso. Este agregado é um **singleton**: no máximo um registro SHALL existir a qualquer momento, endereçado por um id fixo (`STORE_SETTINGS_ID`) definido e controlado inteiramente pelo backend — nunca informado pelo chamador.

#### Scenario: Estrutura do agregado presente

- **WHEN** o módulo `settings` é inspecionado após esta change
- **THEN** existe o agregado `store-settings` com a estrutura padrão (entidade, repositório, casos de uso)
- **AND** a constante `STORE_SETTINGS_ID` está exportada pelo agregado

### Requirement: Entidade `StoreSettings` validada

O agregado `store-settings` SHALL definir a entidade `StoreSettings` com o campo `whatsappNumber` (string, required, formato E.164 validado por `PhoneRule`).

#### Scenario: Criação com dados válidos

- **WHEN** uma entidade `StoreSettings` é instanciada com `whatsappNumber` no formato E.164 válido (ex.: `+5511999998888`)
- **THEN** a entidade é criada sem erros

#### Scenario: Validação de `whatsappNumber`

- **WHEN** `StoreSettings` é instanciada com `whatsappNumber` ausente ou fora do formato E.164
- **THEN** a criação falha com erro de validação correspondente

### Requirement: Contrato do repositório de `store-settings`

O agregado `store-settings` SHALL expor uma interface de repositório no módulo `settings`, no formato `CrudRepository` padrão (persistir, excluir por id, buscar por id, listar paginado), mesmo que apenas parte dessas operações seja exposta via HTTP (ver `settings-backend`). Esta interface NÃO PODE ser alterada por implementações técnicas.

#### Scenario: Contrato cobre operações do CRUD

- **WHEN** o contrato é inspecionado
- **THEN** ele expõe operações para persistir, excluir por id, buscar por id e listar paginado

### Requirement: Caso de uso `save-store-settings` opera sempre sobre o id fixo

O agregado `store-settings` SHALL implementar o caso de uso `save-store-settings`, retornando `void`, recebendo apenas `whatsappNumber` como entrada (sem `id` no input do chamador). Internamente, o caso de uso SHALL consultar `findById(STORE_SETTINGS_ID)`: se encontrar um registro, atualiza; caso contrário, cria um novo registro usando `STORE_SETTINGS_ID` como id.

#### Scenario: Criação do registro quando não existe

- **WHEN** `save-store-settings` é chamado e não existe nenhum registro com `STORE_SETTINGS_ID`
- **THEN** um novo registro é criado com `id` igual a `STORE_SETTINGS_ID` e o `whatsappNumber` informado

#### Scenario: Atualização do registro existente

- **WHEN** `save-store-settings` é chamado e já existe um registro com `STORE_SETTINGS_ID`
- **THEN** o `whatsappNumber` desse registro é atualizado e persistido

### Requirement: Cobertura por testes unitários

O caso de uso `save-store-settings` SHALL ter cobertura por testes unitários usando `FakeStoreSettingsRepository`. Cenários mínimos: criação do registro quando não existe, atualização quando já existe, validação de `whatsappNumber` ausente/inválido.

#### Scenario: Cenários presentes nos testes

- **WHEN** os testes unitários do caso de uso são executados
- **THEN** os cenários listados acima estão presentes
