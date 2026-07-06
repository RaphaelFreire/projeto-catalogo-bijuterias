## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Context

A change-001 entregou a base do projeto: monorepo Turbo `@sdd`, Prisma com schema modular, pacote compartilhado, foundation de erros + JWT no backend, e foundation do frontend (rotas `(public)`/`(private)` com sidebar e a rota vazia `/join`).

Esta change agora introduz o **primeiro módulo de negócio** (`auth`) e materializa o fluxo de cadastro de usuário ponta a ponta, exercitando todas as skills de módulo já existentes (`config-new-module`, `module-aggregate`, `module-entity`, `module-use-case`, `backend-prisma-sync-module`, `backend-prisma-repository`, `backend-nest-controller`).

Premissas e contratos herdados:

- Persistência exclusivamente via Prisma; schema modular por domínio (`apps/backend/prisma/models/auth.model.prisma`).
- Erros de domínio convertidos para `ApiErrorResponse` pelo filtro global do backend.
- Frontend já tem `Toaster` (sonner) montado em `app/layout.tsx` e i18n em `shared/i18n/` com `getMessage(key)`.
- Variável `NEXT_PUBLIC_API_URL` definida em `apps/frontend/.env`.
- Endpoint contrato: `POST {NEXT_PUBLIC_API_URL}/auth/register`, body `{ name, email, password }`, sucesso `201` sem corpo, erros no formato `ApiErrorResponse` (`errors: string[]` com chaves i18n).

## Goals / Non-Goals

**Goals:**

- Entregar `auth` como módulo de domínio reutilizável: entidade `user`, repositório contratual, `crypto.provider` contratual e caso de uso `register-user` (retorno `void`).
- Entregar a implementação técnica no backend: repositório Prisma de `user`, provider bcrypt, `auth.controller.ts` com `POST /auth/register` e testes de integração HTTP em `auth.integration.http`.
- Garantir que o caso de uso valide entrada, recuse e-mail já cadastrado, criptografe a senha antes de persistir, e crie a entidade `user`.
- Garantir que todos os códigos de erro retornados pelo endpoint estejam no i18n (pt e en).
- Entregar a rota `/join` com alternância entre **cadastro** (integrado) e **login** (estrutura visual, handler no-op ou `toast.info`), mostrando um toaster por erro recebido em cadastro e sem redirecionar.

**Non-Goals:**

- Login funcional (apenas a estrutura visual; integração fica para uma change futura).
- Recuperação de senha, confirmação de e-mail, fluxos sociais.
- Validações client-side adicionais (apenas `required` nos inputs).
- Componentização nova fora de `app/(public)/join/` — reaproveitar o que já existe em `shared/`.
- Bibliotecas de HTTP além do `fetch` nativo no frontend.
- Redirecionamento após cadastro (sucesso ou erro).

## Decisions

### Decisão 1: Manter as interfaces do módulo `auth` imutáveis pela camada técnica

A interface do repositório de `user` e a interface `crypto.provider.ts` são definidas no módulo de domínio (`modules/auth/.../user/provider`) e não podem ser alteradas pelas implementações em `apps/backend/src/modules/auth`.

**Por quê:** Preserva o domínio independente de detalhes técnicos. O backend implementa contra contratos estáveis, permitindo trocar a infra (ex.: outra biblioteca de hash) sem tocar no domínio.

### Decisão 2: Implementações técnicas direto em `apps/backend/src/modules/auth`, sem subpasta

O repositório Prisma e o provider bcrypt ficam diretamente em `apps/backend/src/modules/auth/`, sem `infra/`, `prisma/` ou `crypto/` como subpasta intermediária.

**Por quê:** Padrão herdado do projeto (skills `backend-prisma-repository` e `backend-provider-implementation` já produzem nesse layout). Mantém a árvore curta e previsível.

### Decisão 3: Caso de uso instanciado no corpo do método do controller

`auth.controller.ts` injeta o repositório e o `crypto.provider` no construtor; dentro do handler de `POST /auth/register`, instancia `RegisterUserUseCase` passando essas dependências e executa.

**Por quê:** É o padrão do projeto — controllers são thin orquestradores; casos de uso são plain classes instanciadas sob demanda. Evita o overhead de registrar use cases no DI do Nest e mantém o domínio agnóstico ao framework.

### Decisão 4: Caso de uso retorna `void`

`register-user` não retorna o usuário criado. Sucesso é representado por `201` sem corpo no HTTP.

**Por quê:** Reduz superfície da resposta. O frontend só precisa saber se deu certo — exibe toaster de sucesso e fica na mesma tela. Detalhes do usuário criado (id, datas) não são consumidos pelo cadastro.

### Decisão 5: Frontend usa `fetch` nativo e exibe um toaster por erro

Sem cliente HTTP, sem React Query. O handler de submit faz `fetch(POST /auth/register)`, em sucesso (`201`) chama `toast.success`; em erro, parseia `ApiErrorResponse`, itera `errors[]` e dispara `toast.error(getMessage(code))` para cada item — um toaster individual por mensagem.

**Por quê:** Mantém o frontend leve nesta entrega inicial. O contrato `ApiErrorResponse.errors: string[]` é tratado com mapeamento direto, sem camada extra de transformação. Multi-toaster expõe todos os erros simultaneamente.

### Decisão 6: Senha fraca, e-mail duplicado e validações são responsabilidade do backend

O caso de uso `register-user` valida entrada e duplicidade; bcrypt cuida do hash. O frontend não duplica essa lógica.

**Por quê:** Fonte única de verdade para regras de negócio. Evita divergência entre client e server e simplifica o frontend.

### Decisão 7: Capabilities separadas para domínio, backend, i18n e frontend

Quatro capabilities (`auth-domain`, `auth-backend`, `auth-error-i18n`, `auth-frontend-register`) em vez de uma só (ex.: `user-registration`).

**Por quê:** Separa contratos (domínio) de implementações (backend), de cross-cutting (i18n) e de apresentação (frontend). Cada capability tem requisitos verificáveis distintos e pode ser referenciada/estendida por changes futuras (ex.: login reutiliza `auth-domain`).

## Risks / Trade-offs

- **Caso de uso instanciado no controller acopla o handler ao domínio** → Mitigação: o domínio é estável (interfaces fixas) e o padrão é uniforme em todo o projeto; mudanças futuras seguem o mesmo template.
- **Sem validação client-side, o usuário pode submeter dados inválidos repetidamente** → Mitigação: o backend retorna múltiplos erros em uma única resposta e a UI exibe um toaster por erro; o atributo `required` cobre o caso trivial.
- **Múltiplos toasters podem poluir a tela** → Mitigação: padrão herdado do projeto; em casos extremos, agrupar é uma evolução futura, não escopo desta change.
- **bcrypt em ambientes serverless pode ter custo de cold start** → Mitigação: backend roda em container/Node tradicional; custo é aceitável.
- **Login apenas visual pode confundir QA** → Mitigação: handler dispara `toast.info('Login em breve')` ou no-op; comportamento documentado nas tasks de validação.

## Migration Plan

Não há sistema em produção. A entrega é incremental:

1. Criar o módulo `auth` (skills de módulo) e o agregado `user`.
2. Implementar entidade, contratos e caso de uso `register-user`.
3. Sincronizar Prisma e gerar migration.
4. Implementar repositório Prisma e provider bcrypt.
5. Criar `auth.controller.ts` e testes HTTP.
6. Mapear erros no i18n.
7. Implementar a tela `/join` com alternância e formulário integrado.
8. Validar manualmente no navegador.

Rollback é feito descartando a branch.

## Open Questions

- Nenhuma. Contratos e premissas estão definidos pela spec original `.spec/changes/002-registrar-usuario/spec.md`.
