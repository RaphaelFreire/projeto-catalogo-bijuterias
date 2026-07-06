## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Why

O projeto tem hoje quase 20 skills que descrevem um padrão de engenharia bem definido (entidade com validação lazy, casos de uso testados a 100%, regras de validação compartilhadas, repositórios Prisma, controllers finos) — mas os mecanismos automáticos que deveriam garantir esse padrão na prática estão quebrados ou nunca existiram. Rodar `npm run lint` ou `npm run check-types` na raiz do monorepo falha imediatamente, por causa de pacotes de scaffold do `create-turbo` (`packages/ui`, `packages/eslint-config`, `packages/typescript-config`) que nunca foram adaptados para o namespace `@sdd` e que nada no projeto real utiliza. Além disso, nenhum pacote em `modules/` ou `packages/shared` — onde vive toda a regra de negócio — tem configuração de lint, não existe pipeline de CI, e nenhum `jest.config.ts` impõe `coverageThreshold`, então a exigência de "100% de cobertura" documentada nas skills nunca é verificada automaticamente. Hoje, toda verificação de qualidade (teste, tipo, build) é manual, feita à mão a cada mudança.

Esta change não adiciona nenhuma funcionalidade de produto. É uma correção de ferramental: fazer os comandos que já deveriam existir (`lint`, `check-types`) funcionarem de verdade, estender essa cobertura para a camada de domínio, automatizar a verificação via CI, e transformar a regra de "100% de cobertura" em algo que falha sozinho quando violado.

## What Changes

- Remover `packages/ui` e `packages/eslint-config` — scaffold morto do `create-turbo`, confirmado sem nenhuma referência real no projeto (nem por nome de pacote, nem por path relativo). `packages/typescript-config`, ao contrário do que a investigação inicial indicou, **é usado de verdade** via `extends` por path relativo em 5 tsconfigs (`packages/shared` e todos os `modules/*`) — em vez de removido, seu `base.json` foi reconstruído (havia sido apagado por engano durante a implementação, sem git para reverter) e passa a ser tratado como infraestrutura real do monorepo, não mais como scaffold órfão.
- Criar `eslint.config.mjs` (flat-config, ESLint 9) para `packages/shared` e para cada pacote em `modules/` (`auth`, `catalog`, `settings`, `dashboard`), no mesmo espírito do config já usado por `apps/backend` (TypeScript puro, sem regras de React/Next). Adicionar o script `lint` no `package.json` de cada um.
- Corrigir qualquer violação real de lint encontrada nesses pacotes — sem desabilitar regras em massa só para o comando passar.
- Criar `.github/workflows/ci.yml`, rodando build, check-types, lint e test via Turbo em todo push e pull request. (O projeto ainda não é um repositório git — o workflow é criado corretamente mesmo assim, e passa a rodar de fato assim que o versionamento existir, decisão separada do usuário.)
- Adicionar `coverageThreshold` (100% em statements/branches/functions/lines) ao `jest.config.ts` de `packages/shared` e de cada `modules/*`, fechando qualquer lacuna real de cobertura encontrada antes de travar o threshold nesse valor.

## Capabilities

### New Capabilities

- `monorepo-quality-gates`: conjunto de mecanismos automáticos de qualidade do monorepo — lint funcional cobrindo toda a camada real de código (apps + domínio), pipeline de CI, e cobertura de teste imposta via `jest.config.ts`, distinto de `monorepo-setup` (que cobre apenas o bootstrap inicial do workspace).

### Modified Capabilities

Nenhuma. Não há alteração de comportamento de produto — apenas ferramental de desenvolvimento.

## Impact

- Remove três pacotes (`packages/ui`, `packages/eslint-config`, `packages/typescript-config`) que não são consumidos por nenhum código real do projeto.
- `npm run lint` e `npm run check-types`, hoje quebrados na raiz, passam a funcionar e a cobrir `apps/frontend`, `apps/backend`, `packages/shared` e todos os `modules/*`.
- Primeira vez que o projeto tem um pipeline de CI (`.github/workflows/ci.yml`) — ele só roda de fato quando o repositório for versionado em git e tiver um remote, o que está fora do escopo desta change.
- `coverageThreshold` de 100% passa a ser imposto (não apenas documentado) em `packages/shared` e `modules/*`; qualquer lacuna de cobertura real encontrada durante a implementação é fechada com teste, não com redução do threshold.
- **Não inclui** `git init` — decisão explícita do usuário, tratada como assunto separado.
- **Não inclui** a correção do N+1 em `dashboard.prisma.ts` (`getCriticalStock`) — achado menor, registrado à parte, fora do escopo desta change.
- **Não altera** cobertura de `apps/backend`/`apps/frontend` — o padrão de 100% é uma convenção do domínio (`modules/*`/`shared`), não do código de app/controller/UI.
