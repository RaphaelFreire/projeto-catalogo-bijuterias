## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Context

O monorepo é um workspace npm/Turbo com `apps/frontend`, `apps/backend`, `packages/shared`, `packages/ui`, `packages/eslint-config`, `packages/typescript-config` e `modules/{auth,catalog,settings,dashboard}`. Confirmado via investigação direta nesta sessão:

- `npx turbo run lint` e `npx turbo run check-types` na raiz falham imediatamente no pacote `@sdd/ui`: `eslint.config.mjs` e `tsconfig.json` desse pacote ainda importam `@repo/eslint-config`/`@repo/typescript-config` (o scope padrão do `create-turbo`, nunca renomeado para `@sdd/*` quando o resto do projeto foi migrado). Nenhum `package.json` de `apps/*` ou `modules/*` referencia `@sdd/ui`, `@sdd/eslint-config` ou `@sdd/typescript-config` — são pacotes órfãos.
- `apps/backend/eslint.config.mjs` e `apps/frontend/eslint.config.mjs` existem, funcionam de forma independente (cada um com suas próprias `devDependencies` de ESLint, sem nada compartilhado via root) e cobrem apenas o próprio workspace.
- Nenhum pacote em `modules/` nem `packages/shared` tem `eslint.config.mjs` ou script `lint`.
- Não existe `.github/` no projeto — nenhum CI.
- Todo `jest.config.ts` do projeto (`packages/shared`, `modules/*`) é mínimo (`preset: ts-jest`, `testMatch`), sem `coverageThreshold`. O script `test` de cada pacote já roda com `--coverage` (ex.: `modules/catalog/package.json`: `"test": "jest --coverage"`), então o dado de cobertura já é calculado a cada execução — só não há nada que falhe o comando quando a cobertura cai.
- `package.json` raiz declara `"engines": { "node": ">=18" }`, sem `.nvmrc` nem versão de Node fixada em nenhum lugar.

## Goals / Non-Goals

**Goals:**

- `npm run lint` e `npm run check-types`, rodados da raiz via Turbo, terminam com sucesso e cobrem de fato `apps/frontend`, `apps/backend`, `packages/shared` e todos os `modules/*`.
- Nenhuma violação de lint real é silenciada em massa — o que for encontrado é corrigido.
- Existe um workflow de CI (`.github/workflows/ci.yml`) rodando build, check-types, lint e test a cada push/PR, mesmo que ainda não haja repositório git para acioná-lo.
- `packages/shared` e cada `modules/*` têm `coverageThreshold` de 100% (statements/branches/functions/lines) realmente imposto pelo Jest, fechando qualquer lacuna real encontrada antes de travar o valor.

**Non-Goals:**

- Não inclui `git init` nem qualquer configuração de repositório remoto — decisão explícita do usuário, tratada como assunto separado.
- Não corrige o N+1 de `getCriticalStock` em `dashboard.prisma.ts` — achado menor, registrado à parte.
- Não muda cobertura, lint ou comportamento de `apps/backend`/`apps/frontend` além de fazer o lint deles voltar a rodar (o padrão de 100% de cobertura é uma convenção do domínio, não da camada de app/UI).
- Não introduz nenhuma mudança de comportamento de produto/feature.

## Decisions

### Decisão 1: remover `packages/ui` e `packages/eslint-config`; manter e reconstruir `packages/typescript-config`

Em vez de corrigir as referências `@repo/*` quebradas, `packages/ui` e `packages/eslint-config` são removidos inteiramente do monorepo. `packages/typescript-config` **não é removido** — é reconstruído.

**Por quê:** a investigação inicial (via grep em `package.json`) indicou que os três pacotes eram scaffold morto do `create-turbo`, sem nenhuma referência real. Isso se confirmou para `packages/ui` e `packages/eslint-config`. Para `packages/typescript-config`, a checagem original foi insuficiente: 5 tsconfigs reais (`packages/shared`, `modules/auth`, `modules/catalog`, `modules/settings`, `modules/dashboard`) o referenciam via `extends` por **path relativo** (`"../../packages/typescript-config/base.json"`), não por nome de pacote — por isso o grep original não pegou essa dependência. A remoção já havia acontecido quando isso foi descoberto (via falha de `check-types` nesses 5 pacotes); como o projeto não tem git, não havia como reverter, então `base.json` foi reconstruído com o conteúdo padrão do template `create-turbo` e validado empiricamente (`tsc --noEmit`, build completo e suíte de testes dos 5 pacotes, todos idênticos ao comportamento anterior). Esse pacote passa a ser tratado como infraestrutura real do projeto a partir de agora, não mais como candidato a remoção.

### Decisão 2: cada pacote (`packages/shared`, `modules/*`) ganha seu próprio `eslint.config.mjs` e suas próprias `devDependencies` de ESLint — sem hoisting para a raiz

Mesma abordagem já usada por `apps/backend` e `apps/frontend`: cada workspace declara suas próprias `devDependencies` de lint (`eslint`, `@eslint/js`, `typescript-eslint`, `globals`, `eslint-plugin-prettier`, `eslint-config-prettier`) e seu próprio `eslint.config.mjs`, sem depender de um pacote `@sdd/eslint-config` compartilhado.

**Por quê:** é o padrão que já existe nos dois workspaces que funcionam hoje (`apps/backend`, `apps/frontend`) — nenhum deles compartilha config de lint via pacote interno. Criar um pacote `@sdd/eslint-config` novo agora seria introduzir uma abstração que o projeto nunca teve, só para este momento; seguir o padrão já estabelecido é mais simples e mais consistente. O config de `packages/shared` e de cada `modules/*` é mais simples que o de `apps/backend`: são pacotes TypeScript puros (sem NestJS, sem decorators, sem HTTP), então a base é `eslint.configs.recommended` + `tseslint.configs.recommendedTypeChecked` + `eslint-plugin-prettier/recommended`, com `globals.node` e `globals.jest` (para os arquivos de teste), sem as regras específicas de Nest que `apps/backend` relaxa (`no-floating-promises`, `no-unsafe-argument` como `warn`) — essas devem ser reavaliadas caso a caso, mantendo o nível de rigor padrão do `recommended` a menos que uma violação real e justificável apareça durante a implementação.

### Decisão 3: pipeline de CI único, orientado por Turbo, sem matriz de versões

`.github/workflows/ci.yml` roda em `push` e `pull_request`, com um único job: checkout, setup Node (versão LTS fixa, não uma matriz), `npm ci`, depois `npx turbo run build check-types lint test`.

**Por quê:** o projeto não tem matriz de compatibilidade a testar (é uma aplicação, não uma biblioteca publicada) — uma única versão de Node é suficiente. `package.json` raiz já declara `"engines": { "node": ">=18" }` sem fixar uma versão exata; esta change fixa Node 20 (LTS) no workflow como decisão pragmática, já que é a mesma versão seria razoável fixar em `.nvmrc` no futuro (fora do escopo desta change). Turbo já resolve automaticamente a ordem de dependência entre os workspaces (`^build` etc.), então rodar `turbo run build check-types lint test` uma vez cobre o monorepo inteiro sem precisar orquestrar cada workspace manualmente no YAML.

### Decisão 4: cobertura real primeiro, threshold depois — nunca o contrário

Antes de adicionar `coverageThreshold` a qualquer `jest.config.ts`, a implementação roda a suíte de testes daquele pacote com `--coverage` e lê o relatório real. Se a cobertura já é 100% (ou муito próxima), o threshold é travado em 100. Se houver uma lacuna real, o primeiro movimento é fechar a lacuna com teste de verdade — só relaxar o threshold abaixo de 100 como último recurso, documentando o motivo específico no `tasks.md`.

**Por quê:** as skills do projeto (`module-entity`, `module-use-case`, `shared-validation-rule`) já mandam 100% de cobertura para todo código novo — na prática, é razoável esperar que a maior parte do domínio já esteja perto disso, já que essas skills vêm sendo seguidas (manualmente) durante toda a vida do projeto. Configurar um threshold sem antes medir a realidade correria o risco de travar em um número artificialmente baixo só porque "é o que já existe", o que contradiz o próprio objetivo desta change (tornar a regra de 100% real, não apenas formalizá-la em um número qualquer).

**Refinamento descoberto durante a implementação**: medir a cobertura real revelou que todo `src/**` dos 4 pacotes já estava (ou ficou, após 3 correções pontuais em `@sdd/catalog`) em 100% — mas `test/mock/fake-*.ts` (repositórios fake usados só para apoiar testes de caso de uso) nunca chegava lá, porque são dublês simples que não implementam toda a superfície de comportamento que um teste exercitaria numa implementação real. Threshold de 100% sobre a cobertura TOTAL (incluindo mocks) exigiria testes artificiais só para cobrir ramos de infraestrutura de teste, sem nenhum ganho de sinal real. Por isso, `collectCoverageFrom` foi restrito a `src/**/*.ts` em cada `jest.config.ts` — o padrão de 100% das skills é sobre o código de domínio, não sobre os fakes que o testam.

## Risks / Trade-offs

- **CI criado não roda de verdade nesta change** — sem git nem remote, o `.github/workflows/ci.yml` fica pronto mas inerte até o usuário decidir versionar o projeto → Aceito; é uma decisão explícita do usuário manter isso fora de escopo agora, e o arquivo correto já fica pronto para quando o versionamento existir.
- **Remoção de `packages/ui`/`eslint-config`/`typescript-config` é uma operação destrutiva** → Mitigado por confirmar via grep, antes de remover, que nada os importa; se a implementação encontrar qualquer referência real, deve parar e reportar em vez de prosseguir.
- **Fechar lacunas reais de cobertura pode exigir mais trabalho do que só configurar um número** → Aceito como o objetivo desta change; se algum pacote tiver uma lacuna grande demais para fechar nesta entrega, o threshold é relaxado pontualmente para aquele pacote com o motivo documentado, sem bloquear os demais.
- **Corrigir violações de lint reais em `modules/*`/`packages/shared` pode tocar em arquivos de domínio já testados** → Mitigado por preferir a correção mínima (formatação, imports não usados, tipagem) e rodar a suíte de testes de cada pacote depois de qualquer ajuste, para confirmar que nada quebrou.

## Migration Plan

Não há sistema em produção. Entrega incremental, na ordem abaixo (cada etapa depende da anterior):

1. Confirmar (grep) que `packages/ui`, `packages/eslint-config`, `packages/typescript-config` não são importados por nada real; remover os três; ajustar `workspaces` do `package.json` raiz se necessário.
2. Rodar `npm install` na raiz e confirmar que `npx turbo run lint`/`npx turbo run check-types` já não crasham mais (mesmo que ainda só cubram `apps/frontend`/`apps/backend`).
3. Criar `eslint.config.mjs` + script `lint` em `packages/shared` e em cada `modules/*`; corrigir violações reais encontradas; confirmar que os testes de cada pacote continuam passando depois de qualquer ajuste.
4. Rodar `npx turbo run lint` e `npx turbo run check-types` na raiz e confirmar que agora cobrem todos os workspaces reais, sem erro.
5. Para `packages/shared` e cada `modules/*`: rodar `--coverage`, avaliar o relatório real, fechar lacunas com teste quando razoável, e só então adicionar `coverageThreshold: 100` (ou o valor real justificado) ao `jest.config.ts`.
6. Criar `.github/workflows/ci.yml` rodando `npm ci` + `npx turbo run build check-types lint test`.
7. Rodar a suíte completa do monorepo (`npx turbo run build check-types lint test`) uma última vez, na raiz, e confirmar sucesso total antes de encerrar.

Rollback: descartar as mudanças (não há git ainda para reverter via commit, mas nenhuma etapa é destrutiva além da remoção dos três pacotes órfãos, que podem ser recriados a partir do scaffold padrão do `create-turbo` se necessário).

## Open Questions

Nenhuma. A versão de Node do CI (Decisão 3), a estratégia de config por pacote sem hoisting (Decisão 2) e a ordem "cobertura real antes de threshold" (Decisão 4) cobrem as escolhas não triviais desta change.
