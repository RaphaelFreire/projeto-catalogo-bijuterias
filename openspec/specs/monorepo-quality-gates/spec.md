# monorepo-quality-gates Specification

## Purpose
TBD - created by change-011-consertar-lint-ci-cobertura. Update Purpose after archive.

## Requirements

### Requirement: Nenhum pacote órfão de scaffold no workspace

O monorepo NÃO PODE conter pacotes que nenhum `apps/*` ou `modules/*` real importa ou referencia (por nome de pacote ou por path relativo). Especificamente, `packages/ui` e `packages/eslint-config` (scaffold padrão do `create-turbo`, nunca adaptado ao namespace `@sdd`, sem nenhuma referência real) SHALL ser removidos do workspace. `packages/typescript-config` NÃO É órfão — é referenciado via `extends` por path relativo por `packages/shared` e todos os `modules/*` — e SHALL permanecer no workspace com seu `base.json` funcional.

#### Scenario: Workspace sem pacotes órfãos

- **WHEN** o `package.json` de cada `apps/*` e `modules/*` é inspecionado
- **THEN** nenhum deles declara dependência em `@sdd/ui` ou `@sdd/eslint-config`
- **AND** os diretórios `packages/ui` e `packages/eslint-config` não existem mais
- **AND** `packages/typescript-config/base.json` existe e é `extends`-ido com sucesso por `packages/shared` e todos os `modules/*`

### Requirement: `lint` e `check-types` funcionam na raiz e cobrem todo o código real

`npm run check-types`, executado a partir da raiz do monorepo via Turbo, SHALL terminar com sucesso cobrindo `apps/frontend`, `apps/backend`, `packages/shared` e todos os pacotes em `modules/` (`auth`, `catalog`, `settings`, `dashboard`). `npm run lint` SHALL terminar com sucesso para `apps/backend`, `packages/shared` e todos os `modules/*`. `apps/frontend` é uma exceção conhecida: seu lint permanece bloqueado por um bug de hoisting npm pré-existente (`eslint-config-next` resolvido na raiz de `node_modules` sem encontrar `next`, que ficou aninhado em `apps/frontend/node_modules` desde antes do workspace existir) — não introduzido por esta change e fora do escopo resolvido aqui, por decisão explícita do usuário.

#### Scenario: check-types passa sem erro em todos os workspaces reais

- **WHEN** `npx turbo run check-types` é executado na raiz
- **THEN** termina com código de saída `0`
- **AND** o log de execução mostra os workspaces `@sdd/frontend`, `@sdd/backend`, `@sdd/shared`, `@sdd/auth`, `@sdd/catalog`, `@sdd/settings` e `@sdd/dashboard` sendo processados

#### Scenario: lint passa em todos os workspaces reais, exceto a exceção conhecida do frontend

- **WHEN** `npx turbo run lint` é executado na raiz
- **THEN** `@sdd/backend`, `@sdd/shared`, `@sdd/auth`, `@sdd/catalog`, `@sdd/settings` e `@sdd/dashboard` terminam com sucesso
- **AND** `@sdd/frontend` pode falhar por causa do bug de hoisting `next`/`eslint-config-next` documentado, sem que isso bloqueie o restante do workspace

### Requirement: Pipeline de CI cobrindo build, tipos, lint e testes

O projeto SHALL incluir `.github/workflows/ci.yml`, disparado em `push` e `pull_request`, executando ao menos `npm ci` seguido de `npx turbo run build check-types lint test`.

#### Scenario: Workflow de CI presente e bem formado

- **WHEN** `.github/workflows/ci.yml` é inspecionado
- **THEN** ele dispara em `push` e `pull_request`
- **AND** executa instalação de dependências e os comandos de build, check-types, lint e test via Turbo

### Requirement: Cobertura de teste do domínio imposta por `coverageThreshold`

Os pacotes `packages/shared`, `modules/auth`, `modules/catalog` e `modules/settings` SHALL ter `coverageThreshold` configurado em seus respectivos `jest.config.ts`, refletindo a cobertura real alcançada (100%, ou um valor pontualmente inferior quando documentado e justificado), com `collectCoverageFrom` restrito a `src/**/*.ts` — o threshold mede o código de domínio criado pelas skills do projeto, não os repositórios fake em `test/mock/` usados apenas para apoiar os testes de caso de uso. `modules/dashboard` está isento por não ter nenhuma entidade ou caso de uso testável (módulo somente-leitura, sem `test`/jest configurado).

#### Scenario: Threshold configurado reflete a cobertura real

- **WHEN** `npm run test --workspace @sdd/shared`, `@sdd/auth`, `@sdd/catalog` ou `@sdd/settings` é executado
- **THEN** o comando falha se a cobertura ficar abaixo do `coverageThreshold` configurado naquele pacote
- **AND** o comando passa no estado atual do código de cada um desses pacotes

#### Scenario: `modules/dashboard` não exige coverageThreshold

- **WHEN** `modules/dashboard/package.json` é inspecionado
- **THEN** ele não precisa declarar script `test` nem `jest.config.ts`, por não ter nenhuma entidade ou caso de uso de domínio a testar
