## ADDED Requirements

### Requirement: Model Prisma de `product` sincronizado

O backend SHALL incluir/atualizar o model Prisma de `product` em `apps/backend/prisma/models/catalog.model.prisma`, sincronizado com a entidade `Product` do módulo `catalog`, com migration incremental aplicada.

#### Scenario: Model sincronizado e migration aplicada

- **WHEN** o módulo `catalog` é sincronizado com o Prisma do backend
- **THEN** existe `apps/backend/prisma/models/catalog.model.prisma` com o model `product`
- **AND** uma migration nomeada por módulo é gerada e aplicada
- **AND** o schema reflete os campos `name`, `description (nullable)`, `price`, `status`, `availableOnline`, `featured`, `allowsPreOrder`

### Requirement: Repositório Prisma de `product`

O backend SHALL incluir uma implementação Prisma do repositório de `product` em `apps/backend/src/modules/catalog`, respeitando a interface definida no módulo `catalog`.

#### Scenario: Repositório implementa contrato estável

- **WHEN** o repositório Prisma de `product` é construído
- **THEN** ele fica em `apps/backend/src/modules/catalog/product.prisma.ts`
- **AND** implementa a interface do módulo `catalog` sem alterá-la
- **AND** está registrado no módulo Nest com `DbModule` e `PrismaService`

### Requirement: `ProductController` com CRUD autenticado em `/products`

O backend SHALL incluir/atualizar `apps/backend/src/modules/catalog/product.controller.ts` expondo o CRUD em `/products` (criar, atualizar, excluir, obter por id e listar paginado). Todos os endpoints SHALL ser autenticados (sem `@Public()`).

#### Scenario: Endpoints presentes

- **WHEN** `product.controller.ts` é inspecionado
- **THEN** existem handlers para criar, atualizar, excluir, obter por id e listar paginado em `/products`
- **AND** nenhum deles está marcado como `@Public()`

#### Scenario: Acesso não autenticado bloqueado

- **WHEN** uma requisição sem JWT chega em qualquer endpoint de `/products`
- **THEN** o backend responde com `401`

### Requirement: Comandos via casos de uso, consultas via repositório

No `ProductController`, os endpoints de **comando** (criar, atualizar, excluir) SHALL instanciar o caso de uso correspondente no corpo do método (`save-product` ou `delete-product`) recebendo as dependências injetadas via construtor. Os endpoints de **consulta** (obter por id, listar paginado) SHALL chamar o repositório diretamente, sem caso de uso intermediário.

#### Scenario: Comando instancia caso de uso

- **WHEN** o handler de criar/atualizar é executado
- **THEN** uma nova instância de `SaveProduct` é criada dentro do método

- **WHEN** o handler de excluir é executado
- **THEN** uma nova instância de `DeleteProduct` é criada dentro do método

#### Scenario: Consulta chama repositório direto

- **WHEN** o handler de obter por id ou de listar paginado é executado
- **THEN** ele chama o `ProductRepository` injetado diretamente, sem caso de uso

### Requirement: Mapeamento de leitura para objeto simples

Toda resposta de leitura do `ProductController` SHALL ser construída explicitamente como objeto simples no controller, contendo todos os campos públicos: `{ id, name, description, price, status, availableOnline, featured, allowsPreOrder }`. Entidades de domínio NÃO PODEM ser retornadas diretamente (getters de prototype não serializam via `JSON.stringify`).

#### Scenario: Obter por id devolve objeto simples completo

- **WHEN** o handler de obter por id é executado com sucesso
- **THEN** o controller retorna explicitamente `{ id, name, description, price, status, availableOnline, featured, allowsPreOrder }`
- **AND** não retorna a entidade direta

#### Scenario: Listagem devolve objetos simples

- **WHEN** o handler de listagem paginada é executado
- **THEN** cada item da página é mapeado para o objeto simples acima
- **AND** a resposta inclui também os metadados de paginação (ex.: `total`, `page`, `pageSize`)

### Requirement: Cobertura HTTP em `product.integration.http`

O backend SHALL incluir `apps/backend/src/modules/catalog/product.integration.http` (Rest Client) cobrindo os fluxos do CRUD e os principais casos de erro: criação válida, criação com nome inválido, criação com preço negativo, criação com status fora do enum, atualização válida, exclusão de produto existente, exclusão de produto inexistente (404), atualização de produto inexistente, obter por id, listagem paginada, acesso sem JWT.

#### Scenario: Cenários de sucesso e erro presentes

- **WHEN** `product.integration.http` é inspecionado
- **THEN** existem cenários de criação/atualização/exclusão válidas
- **AND** existem cenários para nome inválido, preço negativo, status fora do enum
- **AND** existem cenários para produto inexistente em update e delete (404)
- **AND** existe cenário de listagem paginada
- **AND** existe cenário para acesso sem JWT
