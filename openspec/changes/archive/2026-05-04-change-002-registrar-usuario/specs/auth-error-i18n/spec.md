## ADDED Requirements

### Requirement: Inventário de códigos de erro de `POST /auth/register`

O processo de implementação SHALL identificar todos os códigos de erro possíveis retornados por `POST /auth/register` no campo `errors[]` da `ApiErrorResponse`, lendo `apps/backend/src/modules/auth/auth.integration.http` e `apps/backend/src/shared/errors/api-exception.filter.ts`. A lista identificada SHALL ser registrada na evidência da task correspondente.

#### Scenario: Inventário registrado na evidência

- **WHEN** a task de mapeamento de erros é concluída
- **THEN** a evidência contém a lista completa de códigos de erro identificados nos arquivos fonte indicados

### Requirement: Cobertura completa no i18n do frontend

O frontend SHALL conter, em `apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`, todas as chaves correspondentes aos códigos de erro de `POST /auth/register` identificados no inventário, com tradução em português e inglês, mantendo o padrão existente do arquivo.

#### Scenario: Chave nova adicionada nos dois idiomas

- **WHEN** uma chave de erro identificada está ausente em `messages.pt.ts` ou `messages.en.ts`
- **THEN** ela é adicionada nos dois arquivos com tradução correspondente
- **AND** o padrão de organização e de objeto existente é preservado

#### Scenario: Verificação após mapeamento

- **WHEN** o mapeamento é concluído
- **THEN** todos os códigos do inventário existem como chaves em `messages.pt.ts` e `messages.en.ts`
