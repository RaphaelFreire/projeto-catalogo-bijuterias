## Instruções Compartilhadas

Estas instruções valem para qualquer change deste projeto e devem ser respeitadas durante a execução das tasks abaixo:

- [Como executar](../../shared/como-executar.md) — regras de execução e formato de evidência por task.
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md) — convenções de nomes de arquivos e diretórios.

## 1. Configuração

- [x] 1.1 Criar a estrutura base do monorepo com a skill [config-project-fullstack](../../../.claude/skills/config-project-fullstack) usando o namespace `@sdd`.
  > ✅ 2026-05-04 15:26 — Executado `node .claude/skills/config-project-fullstack/scripts/create-project.js --namespace @sdd`. Monorepo Turbo criado com `apps/frontend` (Next.js) e `apps/backend` (NestJS + @nestjs/config), pacotes em `packages/*` (eslint-config, typescript-config, ui) renomeados sob `@sdd`, lockfile regenerado.
- [x] 1.2 Configurar a infraestrutura do Prisma no backend com a skill [config-prisma](../../../.claude/skills/config-prisma).
  > ✅ 2026-05-04 15:28 — Executado `node .claude/skills/config-prisma/scripts/init-prisma-backend.js --apply --install`. Criados `apps/backend/prisma/{schema.prisma,models/bootstrap.model.prisma,seed/main.ts,migrations}`, `prisma.config.ts`, `docker-compose.yml` derivado de `DATABASE_URL`, `src/db/{db.module.ts,prisma.service.ts}` e `DbModule` registrado em `app.module.ts`. Dependências `prisma`, `@prisma/client`, `@prisma/adapter-pg` e `tsx` instaladas.
- [x] 1.3 Criar o pacote compartilhado com a skill [config-package-shared](../../../.claude/skills/config-package-shared) usando o namespace `@sdd`.
  > ✅ 2026-05-04 15:30 — Executado `node .claude/skills/config-package-shared/scripts/rebuild-shared.js`. Pacote `packages/shared` materializado a partir de `assets/shared-template/` com scope detectado `@sdd`, build via `turbo run build --filter=@sdd/shared` ok. Estrutura `src/{db,error,model,usecase,validation,index.ts}` gerada.
- [x] 1.4 Configurar a base de tratamento de erros e autenticação JWT no backend com a skill [backend-nest-config](../../../.claude/skills/backend-nest-config).
  > ✅ 2026-05-04 15:33 — Executado `node .claude/skills/backend-nest-config/scripts/apply-backend-shared.js`. Instaladas dependências `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@sdd/shared` e `@types/passport-jwt`. Gerada `apps/backend/src/shared/{auth,decorators,errors,types}` com placeholder `__SCOPE__` resolvido para `@sdd`. `app.module.ts` reescrito com `ConfigModule`, `JwtAuthModule`, `DbModule`, `APP_FILTER=ApiExceptionFilter` e `APP_GUARD=JwtAuthGuard`; `app.controller.ts` anotado com `@Public()`; `JWT_SECRET` e `JWT_EXPIRES_IN` adicionados em `.env` / `.env.example`. Build inicial falhou por client Prisma não gerado; após `npm --workspace apps/backend run prisma:generate`, `npm --workspace apps/backend run build` passou.

## 2. Front-end

- [x] 2.1 Executar a skill [frontend-next-config](../../../.claude/skills/frontend-next-config) para configurar a estrutura compartilhada (`shared/`) e as rotas Next.js com grupos public/private e sidebar de navegação.
  > ✅ 2026-05-04 15:42 — Aplicada a skill em modo determinístico: `apps/frontend/src/shared/` materializada a partir de `assets/shared/`, `globals.css` substituído pelo design system dark, layouts `app/{layout.tsx,(private)/layout.tsx,(public)/layout.tsx}`, landing `app/page.tsx`, autenticação `(public)/join/page.tsx` (placeholder substituído por `/example/dashboard`), módulo de exemplo `(private)/example/dashboard/page.tsx` com `EmptyDashboard`, navigation `shared/navigation/app-sidebar-navigation.component.tsx`. Dependências instaladas (`lucide-react`, `recharts`, `clsx`, `tailwind-merge`, `class-variance-authority`, `sonner`, `react-hook-form`, `@hookform/resolvers`, `cmdk`, `react-day-picker`, `date-fns`, `@radix-ui/react-{checkbox,dialog,dropdown-menu,label,popover,radio-group,select,separator,slot,tabs,tooltip}`, `@sdd/shared`). `npm run build` em `apps/frontend` gerou `/`, `/join`, `/example/dashboard` como rotas estáticas. Verificação no preview confirmou landing renderizando "Aplicação" / "Entrar" e `/example/dashboard` renderizando `EmptyDashboard` dentro do shell `(private)` sem erros de console.
