## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Context

O projeto está em estado vazio (apenas a estrutura `openspec/`). Antes de qualquer módulo de negócio, é necessário entregar a base técnica do monorepo, persistência, pacote compartilhado, base do backend (erros + JWT) e estrutura de rotas/shared do frontend.

A entrega aproveita skills determinísticas já existentes em `.claude/skills/`, que conhecem o padrão arquitetural do projeto e produzem resultados consistentes:

- `config-project-fullstack`: cria o monorepo Turbo (`apps/frontend` Next.js porta 3000 e `apps/backend` NestJS porta 4000) com namespace `@sdd`.
- `config-prisma`: configura Prisma com schema modular, `DbModule`/`PrismaService`, seed técnico e docker compose.
- `config-package-shared`: cria o pacote compartilhado consumido por backend, frontend e módulos.
- `backend-nest-config`: configura no backend o tratamento centralizado de erros e a base de autenticação JWT.
- `frontend-next-config`: configura `shared/` e os grupos de rotas Next.js `(public)`/`(private)` com sidebar de navegação.

Restrições e premissas:

- Namespace npm fixo: `@sdd`.
- Portas fixas: backend `4000`, frontend `3000`.
- Persistência somente via Prisma; schema modular por domínio.
- Autenticação no backend baseada em JWT, com tratamento de erros centralizado.
- Esta change entrega apenas infraestrutura: nenhum módulo de domínio é criado aqui.

## Goals / Non-Goals

**Goals:**

- Entregar um monorepo funcional com backend e frontend rodando sob `@sdd`.
- Disponibilizar a infraestrutura de Prisma pronta para receber models por módulo.
- Disponibilizar um pacote compartilhado consumido por backend, frontend e módulos de negócio.
- Entregar tratamento de erros centralizado e base de autenticação JWT no backend, prontos para reuso.
- Entregar no frontend a pasta `shared/` e os grupos de rotas `(public)`/`(private)` com sidebar funcional.
- Garantir que cada peça de infraestrutura seja entregue por uma skill determinística específica.

**Non-Goals:**

- Implementar qualquer módulo de domínio (ex.: `auth`, cadastro de usuário) — fica para changes posteriores.
- Definir entidades, repositórios ou casos de uso de negócio.
- Configurar pipelines de CI/CD, observabilidade ou ambientes além do desenvolvimento local.
- Customizar visualmente a sidebar/UI além do necessário para a estrutura de rotas funcionar.

## Decisions

### Decisão 1: Reaproveitar skills determinísticas em vez de scripts ad-hoc

Cada peça de infraestrutura é entregue por uma skill já existente e validada (`config-project-fullstack`, `config-prisma`, `config-package-shared`, `backend-nest-config`, `frontend-next-config`).

**Por quê:** Skills produzem resultado consistente e replicável. Reduz risco de divergência arquitetural entre projetos e evita reescrever decisões já tomadas.

**Alternativa considerada:** Configurar tudo manualmente via comandos shell. Rejeitada por aumentar a chance de variações sutis em estrutura de pastas e por não capturar convenções do projeto.

### Decisão 2: Manter ordem das tasks da spec original

A ordem original (Configuração: monorepo → prisma → shared → backend-nest; Frontend: frontend-next) é preservada na migração.

**Por quê:** A ordem reflete dependências reais — o monorepo precisa existir antes do Prisma; o pacote compartilhado é consumido pelo backend-nest-config; a base do backend precisa estar pronta antes de o frontend ser configurado, pois reaproveita contratos compartilhados (ex.: `ApiErrorResponse`).

### Decisão 3: Modelar a base como cinco capabilities independentes

Em vez de uma única capability "infraestrutura", separamos em cinco: `monorepo-setup`, `prisma-infrastructure`, `shared-package`, `backend-foundation`, `frontend-foundation`.

**Por quê:** Cada capability mapeia 1:1 para uma skill e tem requisitos verificáveis distintos. Facilita reuso, evolução incremental e referência por changes futuras.

**Alternativa considerada:** Uma única capability `project-base`. Rejeitada por agrupar requisitos heterogêneos e dificultar evolução posterior.

### Decisão 4: Namespace e portas fixos no nível da spec

Namespace `@sdd`, backend `4000`, frontend `3000` ficam codificados como requisitos.

**Por quê:** São contratos do projeto consumidos por toda a stack (URLs, imports, CORS). Mudá-los é uma decisão arquitetural, não um detalhe de implementação.

## Risks / Trade-offs

- **Acoplamento a skills internas** → Mitigação: as skills são versionadas no repositório (`.claude/skills/`); qualquer mudança nelas é rastreável.
- **Ordem de execução incorreta pode quebrar a build** → Mitigação: a ordem das tasks reflete dependências reais; `tasks.md` lista a sequência explicitamente.
- **Skills podem evoluir e divergir desta spec** → Mitigação: a spec referencia as skills por nome; ao executar, o agente segue a versão atual da skill, e qualquer divergência é tratada como follow-up.
- **Mudar namespace ou portas no futuro** → Mitigação: documentado como decisão arquitetural; mudanças exigem nova change que altere as capabilities afetadas.

## Migration Plan

Não há sistema em produção; esta é a primeira change do projeto. A "migração" aqui é a saída do estado vazio para o estado base. Rollback é feito descartando o diretório de trabalho. Cada task da `tasks.md` deve produzir evidência conforme [como executar](../../shared/como-executar.md) ou equivalente OpenSpec, antes de seguir para a próxima.

## Open Questions

- Nenhuma. As decisões de stack e ordem foram herdadas da spec original `.spec/changes/001-criar-projeto/spec.md`.
