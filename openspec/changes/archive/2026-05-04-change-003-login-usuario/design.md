## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Context

A change-002 entregou o cadastro funcional, o agregado `user`, o repositório Prisma, o provider bcrypt e a tela `/join` com cadastro integrado e login só visual. Esta change conclui a autenticação ponta a ponta: caso de uso de login no domínio, JWT na camada HTTP, sessão persistente no front-end com guard e contexto, e integração do formulário de login.

Premissas e contratos herdados:

- Módulo `auth` já existe com agregado `user`, `UserRepository` e `CryptoProvider`.
- Backend NestJS já tem `app/api-exception.filter.ts` convertendo `DomainError` em `ApiErrorResponse`.
- Frontend usa `fetch` nativo (sem cliente HTTP), tem i18n em `shared/i18n` e `Toaster` (sonner) montado em `app/layout.tsx`.
- Rota inicial pós-login: `/example/dashboard` (criada pela change-001).
- Endpoint contrato: `POST {NEXT_PUBLIC_API_URL}/auth/login`, body `{ email, password }`, sucesso `200` com `{ token, user: { id, name, email } }`, erros no formato `ApiErrorResponse`.

## Goals / Non-Goals

**Goals:**

- Manter o módulo de negócio (`modules/auth`) **completamente alheio** a token/JWT/sessão. O caso de uso recebe credenciais e devolve apenas o usuário público.
- Concentrar a geração do JWT no `auth.controller.ts`, a partir da saída do caso de uso.
- Persistir a sessão em cookie `auth_token` via `js-cookie`, sobrevivendo ao fechamento do navegador.
- Hidratar o front-end a partir do cookie usando `decodeJwtPayload` com `TextDecoder('utf-8')` para preservar acentuação.
- Proteger o grupo `(private)` com `AuthGuard` e alimentar o `AdminShell` com dados do usuário logado.
- Tratar usuário inexistente e senha incorreta com a **mesma** mensagem genérica para não vazar quais e-mails existem.

**Non-Goals:**

- Logout server-side, refresh tokens, blacklist/revocação de JWT — não nesta change.
- Recuperação/reset de senha, MFA, confirmação de e-mail, social login.
- Cliente HTTP novo (Axios, React Query) — manter `fetch` nativo.
- Validação client-side adicional além de `required` (mantém o padrão da change-002).
- Cookies httpOnly — o cookie precisa ser lido pelo client para reidratar o contexto.

## Decisions

### Decisão 1: Domínio sem qualquer noção de token

O caso de uso `login-user` recebe `{ email, password }` e devolve `{ id, name, email }`. Não conhece JWT, não tem `TokenProvider`, não recebe segredo, não retorna token.

**Por quê:** Mantém o domínio puro e testável com fakes simples. JWT é detalhe de transporte HTTP — colocar no domínio acoplaria casos de uso (ex.: `register-user`, futuros casos de uso autenticados) a uma decisão de infraestrutura.

**Alternativa considerada:** Domínio devolve token. Rejeitada por vazar transporte para o domínio e por dificultar reutilizar `login-user` em outros transportes (gRPC, fila, GraphQL).

### Decisão 2: Mesma `DomainError('user.credentials.invalid', 401)` para usuário inexistente e senha errada

Não diferenciar 404 vs senha errada.

**Por quê:** Evita enumeration attack (descobrir quais e-mails existem). Padrão da indústria para login.

### Decisão 3: JWT gerado no controller via helper local `jwt.util.ts`

`apps/backend/src/modules/auth/jwt.util.ts` exporta `signUserToken(user, secret): string`. Não é provider, não é injetado como dependência, não é um `TokenProvider` do domínio.

**Por quê:** O helper é puro (assinatura `(user, secret) -> string`) e exclusivo da camada HTTP. Como provider, ele entraria em DI do Nest e poderia tentar invadir o domínio. Como helper local, fica explicitamente fora do contrato do módulo `auth`.

### Decisão 4: Caso de uso instanciado no corpo do método do controller

Mesmo padrão da change-002: `auth.controller.ts` injeta `UserRepository`, `CryptoProvider` e `ConfigService`; dentro do handler de `POST /auth/login`, instancia `LoginUser` passando as dependências e executa.

**Por quê:** Padrão uniforme do projeto. Casos de uso são plain classes; controllers são thin orquestradores.

### Decisão 5: JWT com payload mínimo `{ sub, name, email }` e expiração `14d`

Não incluir senha, hash, roles, permissões. Expiração de 14 dias (a spec original cita 7 dias no contexto técnico e 14d no helper — adoto **14 dias** porque é a definição mais explícita, no helper).

**Por quê:** Payload mínimo reduz risco de vazamento e mantém o token enxuto. 14 dias dá margem confortável para sessões longas, alinhado ao cookie expirando em 7 dias (cookie expira primeiro, JWT serve como fallback de validação).

**Trade-off:** Expirações divergentes (cookie 7d, JWT 14d) — em teoria, o cookie expira antes e o usuário precisa logar de novo; o JWT mais longo permite renovações futuras sem reassinar imediatamente. Em uma change futura de refresh, isso pode ser ajustado.

### Decisão 6: Cookie de sessão sem `httpOnly`

Nome `auth_token`, `sameSite: 'lax'`, `secure` em produção, `expires: 7` dias, **sem** `httpOnly`.

**Por quê:** O frontend precisa ler o cookie para reidratar o `AuthContext` ao montar. `httpOnly` impediria isso. Trade-off conhecido: aumenta superfície para XSS — mitigado pelo CSP do Next.js e pela ausência de injeção de HTML/innerHTML no projeto.

**Alternativa considerada:** Token em `localStorage`. Rejeitada — `localStorage` é igualmente vulnerável a XSS e perde a possibilidade de SSR ler o token automaticamente em changes futuras.

### Decisão 7: Decode UTF-8 do JWT no frontend

`decodeJwtPayload` usa `base64url -> Uint8Array -> TextDecoder('utf-8')` para extrair o payload. Não usar `atob` cru.

**Por quê:** `atob` produz strings binárias e quebra acentuação (ex.: `José` vira `JosÃ©`). Spec exige preservar acentuação no `name` do usuário. `TextDecoder('utf-8')` resolve corretamente.

### Decisão 8: `AuthProvider` no `app/layout.tsx` raiz, `AuthGuard` apenas no `(private)`

Provider raiz cobre tanto `(public)` quanto `(private)`. Guard só no `(private)`.

**Por quê:** A tela `/join` precisa do contexto para detectar sessão ativa e redirecionar — então o provider precisa cobri-la também. Mas só rotas privadas exigem token; `/join` deve ser acessível sem ele. Guard apenas em `(private)` resolve.

### Decisão 9: Capabilities separadas para domínio, backend, sessão e formulário de login

Quatro capabilities (`auth-login-domain`, `auth-login-backend`, `auth-frontend-session`, `auth-frontend-login`).

**Por quê:** Separa contratos do domínio (login puro), HTTP (JWT, endpoint), infraestrutura cliente (cookie, contexto, guard) e apresentação (formulário, redirects, i18n, validação manual). Cada uma pode evoluir independentemente em changes futuras (ex.: refresh token tocaria backend + session, sem mexer no domínio nem no formulário).

## Risks / Trade-offs

- **Cookie sem `httpOnly` aumenta superfície para XSS** → Mitigação: ausência de injeção de HTML no projeto, CSP padrão do Next.js, cookie `sameSite: 'lax'` reduz CSRF.
- **Mensagem genérica em credenciais inválidas pode dificultar suporte ao usuário** → Mitigação: aceito; é o trade-off correto de segurança. UX adicional pode ser feita em telas de "esqueci minha senha" futuras.
- **Discrepância cookie 7d vs JWT 14d pode causar confusão** → Mitigação: documentado aqui; em uma change futura de refresh, alinhar é trivial.
- **Decode manual do JWT no front sem verificação de assinatura** → Mitigação: o front só lê o payload para UX (mostrar nome/e-mail); a verificação real acontece no backend a cada requisição autenticada futura. Aceito.
- **`AuthGuard` redirecionando em `unauthenticated` pode causar loops se `/join` também redirecionar** → Mitigação: redirect em `/join` só dispara quando `status === 'authenticated'`; em `loading`, não renderiza e não redireciona. Estados são mutuamente exclusivos.
- **Helper `jwt.util.ts` pode acabar exportado por engano para o módulo de negócio** → Mitigação: vive em `apps/backend/src/modules/auth/`, fora do workspace `modules/auth`. Não há rota de import a partir do domínio.

## Migration Plan

Não há sistema em produção. A entrega é incremental:

1. Implementar `login-user` no domínio + testes (com fakes).
2. Backend: instalar `jsonwebtoken`, adicionar `JWT_SECRET`, criar `jwt.util.ts`, adicionar `POST /auth/login`, estender testes HTTP.
3. Frontend: instalar `js-cookie`, adicionar chave i18n, criar `decodeJwtPayload`, criar `AuthContext` e `AuthGuard`, mover `AuthProvider` para layout raiz, envolver `(private)` com guard.
4. Integrar `AdminShell` ao contexto e o formulário de login ao backend.
5. Adicionar redirect em `/join` quando autenticado.
6. Validar manualmente todos os cenários no navegador.

Rollback: descartar a branch.

## Open Questions

- Nenhuma. A spec original define todos os contratos. A divergência entre 7d (cookie/contexto técnico) e 14d (helper) foi resolvida adotando 14d no helper conforme a task específica e 7d no cookie conforme a observação local.
