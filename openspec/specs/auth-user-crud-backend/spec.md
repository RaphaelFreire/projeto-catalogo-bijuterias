# auth-user-crud-backend Specification

## Purpose
TBD - created by archiving change change-004-cadastro-usuario. Update Purpose after archive.
## Requirements
### Requirement: `UserController` com CRUD autenticado em `/users`

O backend SHALL incluir `apps/backend/src/modules/auth/user/user.controller.ts` expondo o CRUD em `/users` (criar, atualizar, excluir, obter por id e listar paginado). Todos os endpoints SHALL ser autenticados (sem `@Public()`).

#### Scenario: Endpoints presentes

- **WHEN** `user.controller.ts` é inspecionado
- **THEN** existem handlers para criar, atualizar, excluir, obter por id e listar paginado em `/users`
- **AND** nenhum deles está marcado como `@Public()`

#### Scenario: Acesso não autenticado bloqueado

- **WHEN** uma requisição sem JWT chega em qualquer endpoint de `/users`
- **THEN** o backend responde com `401`

### Requirement: Comandos via casos de uso, consultas via repositório

No `UserController`, os endpoints de **comando** (criar, atualizar, excluir) SHALL instanciar o caso de uso correspondente no corpo do método (`save-user` ou `delete-user`) recebendo `UserRepository` e `CryptoProvider` injetados via construtor. Os endpoints de **consulta** (obter por id, listar paginado) SHALL chamar o repositório diretamente, sem caso de uso.

#### Scenario: Comando instancia caso de uso

- **WHEN** o handler de criar/atualizar é executado
- **THEN** uma nova instância de `SaveUser` é criada dentro do método
- **AND** as dependências são passadas como parâmetro

- **WHEN** o handler de excluir é executado
- **THEN** uma nova instância de `DeleteUser` é criada dentro do método

#### Scenario: Consulta chama repositório direto

- **WHEN** o handler de obter por id ou de listar paginado é executado
- **THEN** ele chama métodos do `UserRepository` injetado, sem caso de uso intermediário

### Requirement: Mapeamento de leitura para objetos simples

Toda resposta de leitura do `UserController` (obter por id, item da listagem) SHALL ser construída explicitamente como objeto simples no controller, contendo apenas os campos públicos (`id`, `name`, `email`). Entidades de domínio NÃO PODEM ser retornadas diretamente, pois `JSON.stringify` produz `{}` sobre getters de prototype.

#### Scenario: Obter por id devolve objeto simples

- **WHEN** o handler de obter por id é executado com sucesso
- **THEN** o controller retorna explicitamente `{ id: user.id, name: user.name, email: user.email }`
- **AND** não retorna a entidade direta nem inclui `password`/`passwordHash`

#### Scenario: Listagem devolve objetos simples

- **WHEN** o handler de listagem paginada é executado
- **THEN** cada item da página é mapeado para `{ id, name, email }` antes de retornar
- **AND** a resposta inclui também os metadados de paginação (ex.: `total`, `page`, `pageSize`)

### Requirement: Cobertura HTTP em `user.integration.http`

O backend SHALL incluir `apps/backend/src/modules/auth/user/user.integration.http` (Rest Client) cobrindo os fluxos do CRUD e os principais casos de erro (ex.: criação válida, atualização válida, atualização sem `password`, exclusão de usuário existente, obter por id, listagem paginada, exclusão de usuário inexistente, acesso sem JWT).

#### Scenario: Cenários presentes

- **WHEN** `user.integration.http` é inspecionado
- **THEN** existe cenário de criação válida
- **AND** existe cenário de atualização válida
- **AND** existe cenário de atualização sem `password` (mantendo hash)
- **AND** existe cenário de exclusão de usuário existente
- **AND** existe cenário de obter por id
- **AND** existe cenário de listagem paginada
- **AND** existem cenários para os principais erros (ex.: usuário inexistente, acesso sem JWT)
