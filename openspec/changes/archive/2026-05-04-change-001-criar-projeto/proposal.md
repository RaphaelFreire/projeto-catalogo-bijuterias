## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Why

O projeto ainda não possui base técnica configurada. Antes de implementar qualquer módulo de negócio (ex.: autenticação, cadastro de usuários), é necessário entregar a infraestrutura compartilhada: monorepo, Prisma, pacote compartilhado, base de erros/autenticação no backend e estrutura de rotas no frontend. Sem essa fundação, os módulos posteriores não terão como evoluir de forma consistente.

## What Changes

- Criar monorepo Turbo com `apps/frontend` (Next.js, porta 3000) e `apps/backend` (NestJS, porta 4000) sob o namespace npm `@sdd`.
- Configurar a infraestrutura do Prisma no backend com schema modular por domínio, `DbModule`, `PrismaService`, seed técnico e docker compose.
- Criar o pacote compartilhado consumido por backend, frontend e módulos de negócio.
- Configurar no backend o tratamento centralizado de erros e a base de autenticação JWT prontos para serem reaproveitados por módulos futuros.
- Configurar no frontend a pasta `shared/` e os grupos de rotas Next.js `(public)` e `(private)` com sidebar de navegação.
- Esta change entrega apenas a base técnica; nenhum módulo de domínio é criado aqui.

## Capabilities

### New Capabilities

- `monorepo-setup`: Estrutura do monorepo Turbo com apps backend (NestJS) e frontend (Next.js) sob o namespace `@sdd`.
- `prisma-infrastructure`: Infraestrutura do Prisma no backend com schema modular, `DbModule`, `PrismaService`, seed técnico e docker compose.
- `shared-package`: Pacote compartilhado base consumido por backend, frontend e módulos de negócio.
- `backend-foundation`: Base do backend NestJS com tratamento centralizado de erros e infraestrutura de autenticação JWT.
- `frontend-foundation`: Estrutura compartilhada do frontend Next.js com pasta `shared/` e grupos de rotas `(public)`/`(private)` com sidebar de navegação.

### Modified Capabilities

<!-- Nenhuma capability existente é modificada; o projeto ainda não possui specs publicadas. -->

## Impact

- Cria os diretórios `apps/backend`, `apps/frontend`, `modules/` (estrutura) e o pacote compartilhado sob o namespace `@sdd`.
- Adiciona dependências de Turbo, Next.js, NestJS, Prisma e infraestrutura associada (docker compose para banco).
- Define contratos compartilhados (erros, autenticação JWT, validações) que serão consumidos por todos os módulos futuros.
- Habilita as próximas changes (módulos de negócio como `auth`, cadastro de usuário) a serem implementadas sobre a base.
