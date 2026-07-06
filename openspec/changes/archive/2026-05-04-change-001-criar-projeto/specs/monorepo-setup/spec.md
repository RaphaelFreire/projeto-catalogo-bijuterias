## ADDED Requirements

### Requirement: Estrutura de monorepo Turbo

O sistema SHALL ser organizado como um monorepo Turbo contendo `apps/frontend` (Next.js, porta 3000) e `apps/backend` (NestJS, porta 4000), todos sob o namespace npm `@sdd`.

#### Scenario: Monorepo inicializado com sucesso

- **WHEN** a base do projeto é criada via skill `config-project-fullstack` com namespace `@sdd`
- **THEN** o repositório contém `apps/frontend` (Next.js) na porta 3000 e `apps/backend` (NestJS) na porta 4000
- **AND** os pacotes do workspace estão sob o namespace `@sdd`
- **AND** as configurações de Turbo, CORS, `@nestjs/config`, `.env.example` e `.env` estão presentes

#### Scenario: Backend e frontend sobem nas portas configuradas

- **WHEN** os serviços `apps/backend` e `apps/frontend` são iniciados localmente
- **THEN** o backend NestJS responde na porta 4000
- **AND** o frontend Next.js responde na porta 3000

### Requirement: Guarda contra reexecução do bootstrap

O sistema SHALL impedir que o bootstrap do monorepo seja reexecutado sobre um workspace já configurado, para não sobrescrever a estrutura existente.

#### Scenario: Tentativa de reexecutar bootstrap em projeto já criado

- **WHEN** a skill `config-project-fullstack` é executada em um diretório que já contém o monorepo
- **THEN** a execução é interrompida sem sobrescrever arquivos existentes
