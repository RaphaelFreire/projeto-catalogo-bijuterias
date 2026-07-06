# settings-backend Specification

## Purpose
TBD - created by change-007-vitrine-publica-whatsapp. Extended by change-008-vitrine-marca-banners-busca (upload/remoção de logo). Update Purpose after archive.

## Requirements

### Requirement: Model Prisma de `store-settings` sincronizado, incluindo logo

O backend SHALL incluir o model Prisma de `store-settings` em `apps/backend/prisma/models/settings.model.prisma`, sincronizado com a entidade `StoreSettings`, com migration incremental aplicada. O model SHALL incluir `logoUrl` (nullable).

#### Scenario: Model sincronizado e migration aplicada

- **WHEN** o módulo `settings` é sincronizado com o Prisma do backend
- **THEN** existe o model `store-settings` (ou nome equivalente) com os campos `whatsappNumber` e `logoUrl` (nullable)
- **AND** uma migration nomeada por módulo é gerada e aplicada

### Requirement: Repositório Prisma de `store-settings`

O backend SHALL incluir uma implementação Prisma do repositório de `store-settings` em `apps/backend/src/modules/settings`, respeitando a interface definida no módulo `settings`, mapeando `logoUrl` em todas as operações.

#### Scenario: Repositório implementa contrato estável

- **WHEN** o repositório Prisma de `store-settings` é construído
- **THEN** ele fica em `apps/backend/src/modules/settings/store-settings/settings.prisma.ts`
- **AND** implementa a interface do módulo `settings` sem alterá-la
- **AND** está registrado no módulo Nest com `DbModule` e `PrismaService`

### Requirement: `SettingsController` expõe leitura pública, atualização autenticada e upload/remoção de logo

O backend SHALL incluir `apps/backend/src/modules/settings/store-settings/settings.controller.ts` expondo `GET /settings` (`@Public()`, incluindo `logoUrl` na resposta), `PUT /settings` (autenticado), `POST /settings/logo` (multipart, autenticado) e `DELETE /settings/logo` (autenticado). O controller NÃO PODE expor `POST /settings`, `DELETE /settings` (do registro inteiro) nem listagem paginada para este agregado.

#### Scenario: Endpoints de logo presentes e autenticados

- **WHEN** `settings.controller.ts` é inspecionado
- **THEN** existem handlers para `POST /settings/logo` e `DELETE /settings/logo`
- **AND** nenhum deles está marcado como `@Public()`

#### Scenario: Leitura é pública e inclui a logo

- **WHEN** uma requisição `GET /settings` chega sem JWT
- **THEN** o backend responde com sucesso (não `401`), incluindo `logoUrl` (ou `null`, se não configurada)

#### Scenario: Upload de logo substitui a anterior

- **WHEN** `POST /settings/logo` é chamado com um arquivo válido e já existe uma logo configurada
- **THEN** o arquivo novo é salvo, `logoUrl` é atualizada para a nova URL
- **AND** o arquivo físico da logo anterior é apagado do disco (falha ao apagar é registrada em log, sem bloquear a operação)

#### Scenario: Upload de logo funciona independentemente de `whatsappNumber` já estar configurado

- **WHEN** `POST /settings/logo` é chamado com um arquivo válido e o registro de `store-settings` ainda não existe (nenhum `whatsappNumber` foi salvo)
- **THEN** o backend responde com sucesso, criando o registro com `logoUrl` preenchida e `whatsappNumber` valendo `null`
- **AND** nenhuma validação exige `whatsappNumber` para que o upload seja aceito

#### Scenario: Remoção de logo

- **WHEN** `DELETE /settings/logo` é chamado com uma logo configurada
- **THEN** `logoUrl` volta a `null`
- **AND** o arquivo físico correspondente é apagado do disco

#### Scenario: Upload/remoção de logo exigem autenticação

- **WHEN** uma requisição a `POST /settings/logo` ou `DELETE /settings/logo` chega sem JWT
- **THEN** o backend responde com `401`

#### Scenario: Atualização cria ou atualiza o registro único

- **WHEN** `PUT /settings` é chamado com um `whatsappNumber` válido
- **THEN** o caso de uso `save-store-settings` é instanciado no corpo do método, operando sobre `STORE_SETTINGS_ID`
- **AND** uma chamada subsequente a `GET /settings` reflete o valor atualizado

### Requirement: Cobertura HTTP em `settings.integration.http`

O backend SHALL incluir/atualizar `apps/backend/src/modules/settings/store-settings/settings.integration.http` (Rest Client) cobrindo: leitura sem configuração prévia, atualização válida, atualização com `whatsappNumber` inválido, leitura sem JWT (sucesso), atualização sem JWT (`401`), upload de logo, remoção de logo, upload/remoção sem JWT (`401`).

#### Scenario: Cenários de sucesso e erro presentes

- **WHEN** `settings.integration.http` é inspecionado
- **THEN** existem cenários de leitura inicial, atualização válida e inválida
- **AND** existe cenário de leitura sem JWT (sucesso) e atualização sem JWT (`401`)
- **AND** existem cenários de upload de logo, remoção de logo e acesso sem JWT nos dois
