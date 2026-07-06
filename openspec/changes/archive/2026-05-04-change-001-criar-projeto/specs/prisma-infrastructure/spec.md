## ADDED Requirements

### Requirement: Infraestrutura do Prisma com schema modular

O backend SHALL ter o Prisma configurado com schema modular por domínio em `apps/backend/prisma/models/*.model.prisma`, permitindo que cada módulo de negócio contribua com seus próprios models.

#### Scenario: Configuração inicial do Prisma

- **WHEN** a skill `config-prisma` é executada no backend
- **THEN** o diretório `apps/backend/prisma/models/` está pronto para receber arquivos `<modulo>.model.prisma`
- **AND** o `prisma.config.ts` está configurado para compor o schema modular

### Requirement: Seed técnico e configuração de execução

O backend SHALL expor um entrypoint de seed técnico em `apps/backend/prisma/seed/main.ts` (sem seeds de módulos de negócio).

#### Scenario: Seed técnico disponível

- **WHEN** o setup do Prisma é finalizado
- **THEN** existe `apps/backend/prisma/seed/main.ts` como entrypoint de seed técnico
- **AND** nenhum seed de módulo de negócio é incluído nesta etapa

### Requirement: DbModule e PrismaService no NestJS

O backend SHALL fornecer `DbModule` e `PrismaService` simples no padrão atual do projeto, prontos para serem importados por módulos que precisem de persistência.

#### Scenario: Módulo de banco disponível

- **WHEN** um módulo do backend importa `DbModule`
- **THEN** o `PrismaService` está disponível para injeção em providers e repositórios

### Requirement: Banco local via Docker Compose

O projeto SHALL incluir um Docker Compose para o banco do backend compatível com a `DATABASE_URL` definida no `.env`, com nomes derivados da identidade do projeto.

#### Scenario: Banco sobe via docker compose

- **WHEN** o desenvolvedor executa o docker compose configurado
- **THEN** um banco compatível com a `DATABASE_URL` do `.env` está disponível localmente
