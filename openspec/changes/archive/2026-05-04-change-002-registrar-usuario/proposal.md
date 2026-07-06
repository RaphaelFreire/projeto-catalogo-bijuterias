## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Why

A change `change-001-criar-projeto` entregou apenas a base técnica (monorepo, Prisma, pacote compartilhado, foundation de erros + JWT, foundation do frontend). O projeto ainda não permite que um usuário se cadastre. Sem o fluxo de registro, nenhum outro caso de uso autenticado pode evoluir, e a rota `/join` criada na change anterior está vazia. Esta change entrega o fluxo completo de **registrar usuário**, ponta a ponta.

## What Changes

- Criar o módulo de domínio `auth` com agregado `user`, entidade validada e caso de uso `register-user` (validação, checagem de duplicidade, hash de senha, criação e persistência).
- Definir no módulo `auth` a interface `crypto.provider.ts` (criptografar e comparar senhas) — sem alteração permitida pela camada técnica.
- Implementar no backend: model Prisma de `user`, repositório Prisma de `user`, provider bcrypt e controller HTTP `auth.controller.ts` que expõe `POST /auth/register` instanciando o caso de uso no corpo do método.
- Adicionar testes de integração HTTP (`auth.integration.http`, Rest Client) para o fluxo de registro.
- Mapear todos os códigos de erro retornados por `POST /auth/register` no i18n do frontend (pt e en).
- Substituir o conteúdo de `app/(public)/join/page.tsx` por uma tela com alternância entre formulário de **cadastro** (integrado ao backend, com toasters por erro e sem redirecionamento) e formulário de **login** (apenas estrutura visual, sem integração).
- Validar manualmente no navegador os cenários previstos (alternância, sucesso, e-mail duplicado, senha fraca, múltiplos erros).

## Capabilities

### New Capabilities

- `auth-domain`: Módulo de domínio `auth` com agregado `user` (entidade, repositório contratual, provider de criptografia contratual e caso de uso `register-user`).
- `auth-backend`: Implementação técnica de `auth` no backend NestJS (Prisma model + repositório, provider bcrypt, controller HTTP e testes de integração).
- `auth-error-i18n`: Mapeamento dos códigos de erro de `POST /auth/register` no sistema de i18n do frontend (pt e en).
- `auth-frontend-register`: Tela `/join` no frontend com alternância entre cadastro (integrado ao backend) e login (estrutura visual).

### Modified Capabilities

<!-- Nenhuma capability existente é modificada; as capabilities da change-001 (frontend-foundation, backend-foundation, etc.) permanecem intactas. -->

## Impact

- Cria o workspace `modules/auth` com agregado `user`.
- Adiciona ao backend a pasta `apps/backend/src/modules/auth` com implementações concretas (repositório Prisma, provider bcrypt, controller, testes HTTP) e dependência `bcrypt`.
- Adiciona model `auth.model.prisma` e gera migration incremental.
- Estende o i18n do frontend (`messages.pt.ts`, `messages.en.ts`) com as chaves de erro do registro.
- Substitui o conteúdo de `app/(public)/join/page.tsx`, sem criar novos componentes fora desse diretório.
- Habilita changes futuras de autenticação (login, recuperação de senha, perfil) a serem implementadas sobre o agregado `user` já existente.
