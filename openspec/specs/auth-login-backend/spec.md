# auth-login-backend Specification

## Purpose
TBD - created by archiving change change-003-login-usuario. Update Purpose after archive.
## Requirements
### Requirement: Dependência `jsonwebtoken` no backend

O backend SHALL incluir `jsonwebtoken` e `@types/jsonwebtoken` no workspace `@sdd/backend`.

#### Scenario: Pacotes instalados

- **WHEN** o `package.json` do backend é inspecionado
- **THEN** `jsonwebtoken` está em `dependencies`
- **AND** `@types/jsonwebtoken` está em `devDependencies`

### Requirement: Variável de ambiente `JWT_SECRET`

O backend SHALL definir `JWT_SECRET` em `apps/backend/.env` e `apps/backend/.env.example`, com valor de exemplo seguro e aviso explícito para troca em produção.

#### Scenario: Variável presente nos arquivos de ambiente

- **WHEN** `apps/backend/.env` e `apps/backend/.env.example` são inspecionados
- **THEN** ambos contêm a chave `JWT_SECRET`
- **AND** `.env.example` traz comentário/aviso para troca em produção

### Requirement: Helper `jwt.util.ts` exclusivo da camada HTTP

O backend SHALL incluir `apps/backend/src/modules/auth/user/jwt.util.ts` com a função `signUserToken(user: { id: string; name: string; email: string }, secret: string): string`. A função SHALL montar o payload `{ sub: user.id, name, email }` e assinar com expiração de `14d`. Este helper NÃO PODE ser exposto como provider de domínio nem importado pelo módulo de negócio `modules/auth`.

#### Scenario: Helper assina o token corretamente

- **WHEN** `signUserToken({ id, name, email }, secret)` é chamado
- **THEN** retorna um JWT cujo payload contém `sub`, `name`, `email`
- **AND** o token tem expiração `14d`
- **AND** não contém senha nem hash

#### Scenario: Helper não importado pelo domínio

- **WHEN** o código de `modules/auth` é inspecionado
- **THEN** nenhum arquivo do módulo de negócio importa `jwt.util.ts`

### Requirement: Endpoint `POST /auth/login`

O backend SHALL expor `POST /auth/login` em `auth.controller.ts` como endpoint público (mesmo padrão de `/auth/register`). O controller injeta `UserRepository`, `CryptoProvider` e `ConfigService`. Dentro do handler, instancia `LoginUser` no corpo do método, executa, e — com a saída `{ id, name, email }` — chama `signUserToken` para gerar o JWT. Resposta de sucesso: `200` com `{ token, user: { id, name, email } }`.

#### Scenario: Login bem-sucedido

- **WHEN** uma requisição `POST /auth/login` chega com credenciais válidas
- **THEN** o backend responde com status `200`
- **AND** o corpo é `{ token, user: { id, name, email } }`
- **AND** `token` é um JWT assinado com `JWT_SECRET` e payload `{ sub, name, email }`

#### Scenario: Credenciais inválidas

- **WHEN** uma requisição `POST /auth/login` chega com e-mail inexistente OU senha incorreta
- **THEN** o backend responde com status `401`
- **AND** o corpo segue `ApiErrorResponse` com a chave `user.credentials.invalid` em `errors[]`

#### Scenario: Erro de validação de entrada

- **WHEN** `POST /auth/login` chega com `email` inválido ou corpo incompleto
- **THEN** o backend responde com status `422`
- **AND** o corpo segue `ApiErrorResponse` com chaves de validação correspondentes

#### Scenario: Caso de uso instanciado no corpo do método

- **WHEN** o handler é executado
- **THEN** uma nova instância de `LoginUser` é criada dentro do método
- **AND** as dependências (`UserRepository`, `CryptoProvider`) são passadas como parâmetro
- **AND** `signUserToken` é chamado fora do caso de uso, na camada do controller

### Requirement: Cobertura HTTP estendida

O backend SHALL estender `apps/backend/src/modules/auth/user/auth.integration.http` com cenários de login: credenciais válidas (200), e-mail inexistente (401), senha incorreta (401), e-mail inválido (422), corpo incompleto (422).

#### Scenario: Cenários de login presentes nos testes

- **WHEN** `auth.integration.http` é inspecionado
- **THEN** existe cenário `200` com credenciais válidas devolvendo `{ token, user }`
- **AND** existe cenário `401` para e-mail inexistente
- **AND** existe cenário `401` para senha incorreta
- **AND** existe cenário `422` para e-mail inválido
- **AND** existe cenário `422` para corpo incompleto

