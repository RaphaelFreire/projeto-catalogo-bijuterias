# catalog-category-backend Specification

## Purpose
TBD - created by change-006-catalogo-categoria-estoque-imagem. Update Purpose after archive.

## Requirements

### Requirement: Model Prisma de `category` sincronizado

O backend SHALL incluir o model Prisma de `category` em `apps/backend/prisma/models/catalog.model.prisma`, sincronizado com a entidade `Category` do módulo `catalog`, com migration incremental aplicada.

#### Scenario: Model sincronizado e migration aplicada

- **WHEN** o módulo `catalog` é sincronizado com o Prisma do backend
- **THEN** existe o model `category` em `catalog.model.prisma`
- **AND** uma migration nomeada por módulo é gerada e aplicada
- **AND** o schema reflete o campo `name`

### Requirement: Repositório Prisma de `category`

O backend SHALL incluir uma implementação Prisma do repositório de `category` em `apps/backend/src/modules/catalog`, respeitando a interface definida no módulo `catalog`.

#### Scenario: Repositório implementa contrato estável

- **WHEN** o repositório Prisma de `category` é construído
- **THEN** ele fica em `apps/backend/src/modules/catalog/category/category.prisma.ts`
- **AND** implementa a interface do módulo `catalog` sem alterá-la
- **AND** está registrado no módulo Nest com `DbModule` e `PrismaService`

### Requirement: `CategoryController` com CRUD autenticado em `/categories`

O backend SHALL incluir `apps/backend/src/modules/catalog/category/category.controller.ts` expondo o CRUD completo em `/categories` (criar, atualizar, excluir, obter por id e listar paginado). Todos os endpoints SHALL ser autenticados (sem `@Public()`). Comandos (criar, atualizar, excluir) instanciam o caso de uso correspondente no corpo do método; consultas (obter por id, listar paginado) chamam o repositório diretamente.

#### Scenario: Endpoints presentes e autenticados

- **WHEN** `category.controller.ts` é inspecionado
- **THEN** existem handlers para criar, atualizar, excluir, obter por id e listar paginado em `/categories`
- **AND** nenhum deles está marcado como `@Public()`

#### Scenario: Acesso não autenticado bloqueado

- **WHEN** uma requisição sem JWT chega em qualquer endpoint de `/categories`
- **THEN** o backend responde com `401`

### Requirement: Mapeamento de leitura para objeto simples

Toda resposta de leitura do `CategoryController` SHALL ser construída explicitamente como objeto simples no controller, contendo `{ id, name }`. Entidades de domínio NÃO PODEM ser retornadas diretamente.

#### Scenario: Obter por id devolve objeto simples

- **WHEN** o handler de obter por id é executado com sucesso
- **THEN** o controller retorna explicitamente `{ id, name }`

#### Scenario: Listagem devolve objetos simples com paginação

- **WHEN** o handler de listagem paginada é executado
- **THEN** cada item da página é mapeado para `{ id, name }`
- **AND** a resposta inclui os metadados de paginação (`items`, `total`, `page`, `perPage`)

### Requirement: Cobertura HTTP em `category.integration.http`

O backend SHALL incluir `apps/backend/src/modules/catalog/category/category.integration.http` (Rest Client) cobrindo os fluxos do CRUD e os principais casos de erro: criação válida, criação com nome inválido, atualização válida, exclusão de categoria existente, exclusão/atualização de categoria inexistente (404), listagem paginada, acesso sem JWT.

#### Scenario: Cenários de sucesso e erro presentes

- **WHEN** `category.integration.http` é inspecionado
- **THEN** existem cenários de criação/atualização/exclusão válidas
- **AND** existem cenários para nome inválido
- **AND** existem cenários para categoria inexistente em update e delete (404)
- **AND** existe cenário de listagem paginada e de acesso sem JWT
