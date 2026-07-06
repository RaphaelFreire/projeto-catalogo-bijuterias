# settings-domain Specification

## Purpose
TBD - created by change-007-vitrine-publica-whatsapp. Extended by change-008-vitrine-marca-banners-busca (logo da loja). Update Purpose after archive.

## Requirements

### Requirement: Agregado singleton `store-settings` no módulo `settings`

O módulo `settings` SHALL incluir o agregado `store-settings` com a estrutura padrão de pastas para entidade, repositório e casos de uso. Este agregado é um **singleton**: no máximo um registro SHALL existir a qualquer momento, endereçado por um id fixo (`STORE_SETTINGS_ID`) definido e controlado inteiramente pelo backend — nunca informado pelo chamador.

#### Scenario: Estrutura do agregado presente

- **WHEN** o módulo `settings` é inspecionado após esta change
- **THEN** existe o agregado `store-settings` com a estrutura padrão (entidade, repositório, casos de uso)
- **AND** a constante `STORE_SETTINGS_ID` está exportada pelo agregado

### Requirement: Entidade `StoreSettings` validada, com `whatsappNumber` e `logoUrl` opcionais e independentes

O agregado `store-settings` SHALL definir a entidade `StoreSettings` com o campo `whatsappNumber` (string | null, opcional, validado no formato E.164 por `PhoneRule` somente quando informado — `null` quando ausente) e o campo `logoUrl` (string | null, opcional, validado como URL absoluta com `UrlRule` somente quando informado — `null` quando ausente). Os dois campos SHALL ser tratados de forma simétrica e independente: nenhum é pré-requisito para o outro.

#### Scenario: Criação com dados válidos

- **WHEN** uma entidade `StoreSettings` é instanciada com `whatsappNumber` no formato E.164 válido (ex.: `+5511999998888`) e sem `logoUrl`
- **THEN** a entidade é criada sem erros
- **AND** `logoUrl` vale `null`

#### Scenario: Criação com logo informada, sem `whatsappNumber`

- **WHEN** uma entidade `StoreSettings` é instanciada com `logoUrl` sendo uma URL absoluta válida e sem `whatsappNumber`
- **THEN** a entidade é criada sem erros com `logoUrl` preenchida
- **AND** `whatsappNumber` vale `null`

#### Scenario: Validação de `whatsappNumber`

- **WHEN** `StoreSettings` é instanciada com `whatsappNumber` informado, mas fora do formato E.164
- **THEN** a criação falha com erro de validação correspondente
- **WHEN** `StoreSettings` é instanciada sem `whatsappNumber`
- **THEN** a criação não falha por causa deste campo — `whatsappNumber` vale `null`

#### Scenario: Validação de `logoUrl`

- **WHEN** `StoreSettings` é instanciada com `logoUrl` informada, mas que não é uma URL válida
- **THEN** a criação falha com erro de validação correspondente
- **WHEN** `StoreSettings` é instanciada sem `logoUrl`
- **THEN** a criação não falha por causa deste campo — `logoUrl` vale `null`

### Requirement: Contrato do repositório de `store-settings`

O agregado `store-settings` SHALL expor uma interface de repositório no módulo `settings`, no formato `CrudRepository` padrão (persistir, excluir por id, buscar por id, listar paginado), mesmo que apenas parte dessas operações seja exposta via HTTP (ver `settings-backend`). Esta interface NÃO PODE ser alterada por implementações técnicas.

#### Scenario: Contrato cobre operações do CRUD

- **WHEN** o contrato é inspecionado
- **THEN** ele expõe operações para persistir, excluir por id, buscar por id e listar paginado

### Requirement: Caso de uso `save-store-settings` opera sempre sobre o id fixo, preservando campos não informados

O agregado `store-settings` SHALL implementar o caso de uso `save-store-settings`, retornando `void`, recebendo `whatsappNumber` e `logoUrl` como entrada, ambos opcionais e independentes entre si (sem `id` no input do chamador). Internamente, o caso de uso SHALL consultar `findById(STORE_SETTINGS_ID)`: se encontrar um registro, atualiza (preservando `whatsappNumber` e `logoUrl` existentes individualmente quando não informados na chamada); caso contrário, cria um novo registro usando `STORE_SETTINGS_ID` como id, com cada campo não informado permanecendo `null`.

#### Scenario: Criação do registro quando não existe

- **WHEN** `save-store-settings` é chamado e não existe nenhum registro com `STORE_SETTINGS_ID`
- **THEN** um novo registro é criado com `id` igual a `STORE_SETTINGS_ID` e o `whatsappNumber` informado

#### Scenario: Criação do registro apenas com `logoUrl`, sem `whatsappNumber`

- **WHEN** `save-store-settings` é chamado apenas com `logoUrl` e não existe nenhum registro com `STORE_SETTINGS_ID`
- **THEN** um novo registro é criado com `logoUrl` preenchida e `whatsappNumber` valendo `null`

#### Scenario: Atualização do registro existente

- **WHEN** `save-store-settings` é chamado e já existe um registro com `STORE_SETTINGS_ID`
- **THEN** o `whatsappNumber` desse registro é atualizado e persistido

#### Scenario: Atualização sem `logoUrl` preserva o valor existente

- **WHEN** `save-store-settings` é chamado sem `logoUrl` e já existe um registro com `logoUrl` preenchida
- **THEN** o registro atualizado mantém a `logoUrl` anterior

#### Scenario: Atualização sem `whatsappNumber` preserva o valor existente

- **WHEN** `save-store-settings` é chamado sem `whatsappNumber` (ex.: apenas com `logoUrl`) e já existe um registro com `whatsappNumber` preenchido
- **THEN** o registro atualizado mantém o `whatsappNumber` anterior

### Requirement: Cobertura por testes unitários

O caso de uso `save-store-settings` SHALL ter cobertura por testes unitários usando `FakeStoreSettingsRepository`. Cenários mínimos: criação do registro quando não existe, atualização quando já existe, criação sem `whatsappNumber` (permanece `null`), validação de `whatsappNumber` inválido quando informado, criação/atualização com `logoUrl` válida, validação de `logoUrl` com formato inválido, atualização sem `logoUrl` preservando o valor existente, atualização sem `whatsappNumber` preservando o valor existente.

#### Scenario: Cenários presentes nos testes

- **WHEN** os testes unitários do caso de uso são executados
- **THEN** os cenários listados acima estão presentes
