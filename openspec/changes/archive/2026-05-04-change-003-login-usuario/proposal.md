## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Why

A change-002 entregou o cadastro de usuário e a estrutura visual do login, mas o login ainda não autentica nada — não há caso de uso, não há JWT, não há sessão e as rotas privadas não estão protegidas. Esta change conclui a autenticação: implementa `login-user` no módulo de negócio (sem noção de token), gera o JWT na camada de back-end, persiste a sessão em cookie no front-end e protege as rotas privadas com um guard que consome um contexto de autenticação.

## What Changes

- Implementar o caso de uso `login-user` no módulo `auth`: entrada `{ email, password }`, saída `{ id, name, email }`, sem qualquer referência a token/JWT/sessão. Em credenciais inválidas, lançar `DomainError('user.credentials.invalid', 401)` — mensagem genérica, mesma resposta para usuário inexistente e senha incorreta.
- Cobrir `login-user` com testes unitários reaproveitando `FakeUserRepository` e `FakeCryptoProvider` (cobertura 100%).
- Instalar `jsonwebtoken` no backend e adicionar `JWT_SECRET` em `.env`/`.env.example`.
- Criar helper `jwt.util.ts` em `apps/backend/src/modules/auth` com `signUserToken(user, secret): string` (payload `{ sub, name, email }`, expiração `14d`); helper exclusivo da camada HTTP.
- Adicionar `POST /auth/login` em `auth.controller.ts`: instanciar `LoginUser` no corpo do método, chamar `signUserToken` com a saída e responder `200` com `{ token, user }`.
- Estender `auth.integration.http` com cenários de login (200, 401×2, 422×2).
- Instalar `js-cookie` no frontend e adicionar a chave i18n `user.credentials.invalid` em pt/en.
- Criar `decodeJwtPayload` em `apps/frontend/src/modules/auth/util/jwt.util.ts` usando `TextDecoder('utf-8')` para preservar acentuação.
- Criar `AuthContext` (cookie `auth_token`, hidratação, `login`/`logout`, `useAuth()`) e `AuthGuard` (placeholder em loading, redirect para `/join` em unauthenticated) em `apps/frontend/src/modules/auth/{context,guard}`.
- Envolver layouts: `AuthProvider` no `app/layout.tsx` raiz; `AuthGuard` no layout do grupo `(private)`. `AdminShell` consome `useAuth()` para `name`/`email` e `onLogout` chama `auth.logout()` + `router.push('/join')`.
- Integrar o formulário de login: `POST /auth/login` via `fetch` nativo, em sucesso `auth.login(token)` + `router.push('/example/dashboard')`; em erro, um toaster por chave de `errors[]`.
- Em `/join`, redirecionar automaticamente para `/example/dashboard` quando `status === 'authenticated'`; durante `loading`, não renderizar formulário.
- Validar manualmente no navegador todos os cenários previstos (incluindo um caso com acentuação no nome, ex.: `José da Conceição`).

## Capabilities

### New Capabilities

- `auth-login-domain`: Caso de uso `login-user` no módulo `auth`, sem qualquer referência a token/JWT/sessão.
- `auth-login-backend`: Endpoint `POST /auth/login`, helper `jwt.util.ts`, geração de JWT na camada do controller a partir da saída do caso de uso, e cobertura HTTP estendida.
- `auth-frontend-session`: Sessão de usuário no frontend (`AuthContext`, `AuthGuard`, cookie `auth_token` via `js-cookie`, `decodeJwtPayload` com UTF-8) e integração com layouts e `AdminShell`.
- `auth-frontend-login`: Integração do formulário de login com o backend, chave i18n `user.credentials.invalid`, redirecionamentos e validação manual no navegador.

### Modified Capabilities

<!-- Nenhuma capability existente é modificada em nível de requisito. As capabilities da change-002 (auth-domain, auth-backend, auth-frontend-register) permanecem válidas; esta change estende o módulo `auth` com novos artefatos e adiciona um novo endpoint, sem alterar comportamento existente. -->

## Impact

- Adiciona ao módulo `auth` o caso de uso `login-user` e seus testes.
- Adiciona ao backend dependência `jsonwebtoken`, helper `jwt.util.ts`, endpoint `POST /auth/login` e novos cenários em `auth.integration.http`.
- Adiciona variáveis `JWT_SECRET` em `.env`/`.env.example` (com aviso para troca em produção).
- Adiciona ao frontend dependência `js-cookie`, módulo `apps/frontend/src/modules/auth/{context,guard,util}` com `AuthContext`, `AuthGuard` e `decodeJwtPayload`, e integra `AdminShell` ao contexto.
- Estende `messages.pt.ts` e `messages.en.ts` com a chave `user.credentials.invalid`.
- Habilita changes futuras (perfil, logout server-side, recuperação de senha, módulos privados) a serem implementadas sobre uma sessão funcional.
