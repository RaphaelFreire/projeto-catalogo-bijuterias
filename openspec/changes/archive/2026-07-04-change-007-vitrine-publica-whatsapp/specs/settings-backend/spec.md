# settings-backend Specification

## Purpose
TBD - created by change-007-vitrine-publica-whatsapp. Update Purpose after archive.

## Requirements

### Requirement: Model Prisma de `store-settings` sincronizado

O backend SHALL incluir o model Prisma de `store-settings` em `apps/backend/prisma/models/settings.model.prisma`, sincronizado com a entidade `StoreSettings`, com migration incremental aplicada.

#### Scenario: Model sincronizado e migration aplicada

- **WHEN** o módulo `settings` é sincronizado com o Prisma do backend
- **THEN** existe o model `store-settings` (ou nome equivalente) com o campo `whatsappNumber`
- **AND** uma migration nomeada por módulo é gerada e aplicada

### Requirement: Repositório Prisma de `store-settings`

O backend SHALL incluir uma implementação Prisma do repositório de `store-settings` em `apps/backend/src/modules/settings`, respeitando a interface definida no módulo `settings`.

#### Scenario: Repositório implementa contrato estável

- **WHEN** o repositório Prisma de `store-settings` é construído
- **THEN** ele fica em `apps/backend/src/modules/settings/settings.prisma.ts`
- **AND** implementa a interface do módulo `settings` sem alterá-la
- **AND** está registrado no módulo Nest com `DbModule` e `PrismaService`

### Requirement: `SettingsController` expõe apenas leitura pública e atualização autenticada

O backend SHALL incluir `apps/backend/src/modules/settings/settings.controller.ts` expondo **apenas** `GET /settings` (marcado com `@Public()`) e `PUT /settings` (autenticado, sem `@Public()`). O controller NÃO PODE expor `POST`, `DELETE` nem listagem paginada para este agregado.

#### Scenario: Apenas GET e PUT expostos

- **WHEN** `settings.controller.ts` é inspecionado
- **THEN** existem handlers para `GET /settings` e `PUT /settings`
- **AND** não existe handler `POST /settings`, `DELETE /settings` nem listagem

#### Scenario: Leitura é pública

- **WHEN** uma requisição `GET /settings` chega sem JWT
- **THEN** o backend responde com sucesso (não `401`)

#### Scenario: Atualização exige autenticação

- **WHEN** uma requisição `PUT /settings` chega sem JWT
- **THEN** o backend responde com `401`

#### Scenario: Leitura sem configuração prévia

- **WHEN** `GET /settings` é chamado antes de qualquer `PUT /settings` ter sido feito
- **THEN** o backend responde com sucesso, indicando a ausência de configuração (ex.: `whatsappNumber: null`), sem lançar erro

#### Scenario: Atualização cria ou atualiza o registro único

- **WHEN** `PUT /settings` é chamado com um `whatsappNumber` válido
- **THEN** o caso de uso `save-store-settings` é instanciado no corpo do método, operando sobre `STORE_SETTINGS_ID`
- **AND** uma chamada subsequente a `GET /settings` reflete o valor atualizado

### Requirement: Cobertura HTTP em `settings.integration.http`

O backend SHALL incluir `apps/backend/src/modules/settings/settings.integration.http` (Rest Client) cobrindo: leitura sem configuração prévia, atualização válida, atualização com `whatsappNumber` inválido, leitura sem JWT (sucesso), atualização sem JWT (`401`).

#### Scenario: Cenários de sucesso e erro presentes

- **WHEN** `settings.integration.http` é inspecionado
- **THEN** existem cenários de leitura inicial, atualização válida e inválida
- **AND** existe cenário de leitura sem JWT (sucesso) e atualização sem JWT (`401`)
