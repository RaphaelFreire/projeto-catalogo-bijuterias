# auth-frontend-session Specification

## Purpose
TBD - created by archiving change change-003-login-usuario. Update Purpose after archive.
## Requirements
### Requirement: Dependência `js-cookie` no frontend

O frontend SHALL incluir `js-cookie` e `@types/js-cookie` no workspace `@sdd/frontend`.

#### Scenario: Pacotes instalados

- **WHEN** o `package.json` do frontend é inspecionado
- **THEN** `js-cookie` está em `dependencies`
- **AND** `@types/js-cookie` está em `devDependencies`

### Requirement: Decode UTF-8 do payload do JWT

O frontend SHALL incluir `apps/frontend/src/modules/auth/util/jwt.util.ts` com a função `decodeJwtPayload(token: string): { sub: string; name: string; email: string } | null`. A função SHALL converter base64url → `Uint8Array` → `TextDecoder('utf-8')` para preservar acentuação. NÃO PODE usar `atob` cru.

#### Scenario: Decode preserva acentuação

- **WHEN** `decodeJwtPayload` recebe um token cujo payload contém `name = "José da Conceição"`
- **THEN** o retorno tem `name === "José da Conceição"` (acentuação intacta)

#### Scenario: Token inválido devolve `null`

- **WHEN** `decodeJwtPayload` recebe um token mal formado
- **THEN** o retorno é `null`

#### Scenario: Cobertura por teste ou validação manual

- **WHEN** a implementação é concluída
- **THEN** existe um teste unitário simples OU evidência manual com um token contendo `José da Silva` provando preservação da acentuação

### Requirement: `AuthContext` em `apps/frontend/src/modules/auth/context`

O frontend SHALL incluir `apps/frontend/src/modules/auth/context/auth.context.tsx` expondo um `AuthProvider` com estado `{ user: { id, name, email } | null; token: string | null; status: 'loading' | 'authenticated' | 'unauthenticated' }`, e um hook `useAuth()` para consumo. Na montagem, SHALL ler o cookie `auth_token`, decodificar via `decodeJwtPayload` e hidratar o estado; se inválido/ausente, `status === 'unauthenticated'`.

#### Scenario: Hidratação a partir do cookie

- **WHEN** o `AuthProvider` é montado e existe um cookie `auth_token` válido
- **THEN** o estado é hidratado com `user` (a partir do payload), `token` e `status === 'authenticated'`

#### Scenario: Sem cookie ou cookie inválido

- **WHEN** o `AuthProvider` é montado e o cookie `auth_token` está ausente ou contém um token inválido
- **THEN** `status === 'unauthenticated'` e `user`/`token` são `null`

#### Scenario: API `login`/`logout`

- **WHEN** `auth.login(token)` é chamado
- **THEN** o cookie `auth_token` é gravado e o estado é hidratado para `authenticated`

- **WHEN** `auth.logout()` é chamado
- **THEN** o cookie `auth_token` é removido e o estado vira `unauthenticated`

### Requirement: Cookie de sessão `auth_token`

O cookie de sessão SHALL ser gravado com nome `auth_token`, atributos `sameSite: 'lax'`, `secure` em produção e `expires: 7` dias. NÃO PODE ser `httpOnly` — o cookie precisa ser legível pelo client para reidratar o contexto.

#### Scenario: Atributos do cookie em produção

- **WHEN** o cookie é gravado em ambiente de produção
- **THEN** ele tem `sameSite=Lax`, `Secure` e `Max-Age` correspondente a 7 dias

#### Scenario: Cookie legível pelo client

- **WHEN** o `AuthProvider` é montado
- **THEN** ele consegue ler o cookie `auth_token` via `js-cookie`

### Requirement: `AuthGuard` em `apps/frontend/src/modules/auth/guard`

O frontend SHALL incluir `apps/frontend/src/modules/auth/guard/auth.guard.tsx` que: enquanto `status === 'loading'`, renderiza um placeholder neutro (`null` ou skeleton mínimo); se `unauthenticated`, chama `router.replace('/join')` e renderiza `null`; se `authenticated`, renderiza `children`.

#### Scenario: Estado de loading não causa flash

- **WHEN** o `AuthGuard` está renderizando com `status === 'loading'`
- **THEN** apenas um placeholder neutro é renderizado, sem expor conteúdo privado

#### Scenario: Sem sessão redireciona

- **WHEN** o `AuthGuard` renderiza com `status === 'unauthenticated'`
- **THEN** o roteador é instruído a substituir a rota atual por `/join`
- **AND** `children` não é renderizado

#### Scenario: Sessão ativa renderiza conteúdo

- **WHEN** o `AuthGuard` renderiza com `status === 'authenticated'`
- **THEN** `children` é renderizado normalmente

### Requirement: Layouts envolvidos pelo provider e guard

O `AuthProvider` SHALL ser montado em `app/layout.tsx` raiz (ou layout pai equivalente) cobrindo tanto o grupo `(public)` quanto o `(private)`. O `AuthGuard` SHALL envolver o layout do grupo `(private)` (`app/(private)/layout.tsx`).

#### Scenario: Provider cobre ambos os grupos

- **WHEN** uma página de `(public)` ou de `(private)` é renderizada
- **THEN** `useAuth()` está disponível em ambas

#### Scenario: Guard ativo apenas em `(private)`

- **WHEN** uma página de `(public)` é acessada
- **THEN** `AuthGuard` não bloqueia o acesso

- **WHEN** uma página de `(private)` é acessada
- **THEN** `AuthGuard` aplica as regras de loading/unauthenticated/authenticated

### Requirement: `AdminShell` consome dados do `useAuth()`

O `AdminShell` (dropdown do header) SHALL exibir `name` e `email` do usuário a partir de `useAuth()`, substituindo valores hardcoded. O `onLogout` SHALL chamar `auth.logout()` e em seguida `router.push('/join')`.

#### Scenario: Header reflete o usuário logado

- **WHEN** o usuário está autenticado e o `AdminShell` é renderizado
- **THEN** o dropdown exibe `name` e `email` do usuário do contexto
- **AND** acentuação é preservada (ex.: `José da Conceição`)

#### Scenario: Logout limpa sessão

- **WHEN** o usuário aciona "Logout" no dropdown
- **THEN** `auth.logout()` é chamado
- **AND** o roteador navega para `/join`

