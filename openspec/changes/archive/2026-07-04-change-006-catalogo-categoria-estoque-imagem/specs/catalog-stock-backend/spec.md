# catalog-stock-backend Specification

## Purpose
TBD - created by change-006-catalogo-categoria-estoque-imagem. Update Purpose after archive.

## Requirements

### Requirement: Model Prisma de `stock` sincronizado, 1:1 com `product`

O backend SHALL incluir o model Prisma de `stock` em `apps/backend/prisma/models/catalog.model.prisma`, sincronizado com a entidade `Stock`, com `productId` marcado como único (`@unique`) e com foreign key para `Product` configurada com `onDelete: Cascade`.

#### Scenario: Model sincronizado com relação 1:1 e cascade

- **WHEN** o módulo `catalog` é sincronizado com o Prisma do backend
- **THEN** existe o model `stock` em `catalog.model.prisma` com `productId` único
- **AND** a foreign key de `productId` para `product` usa `onDelete: Cascade`
- **AND** uma migration nomeada por módulo é gerada e aplicada

#### Scenario: Exclusão de produto remove o estoque associado

- **WHEN** um produto com registro de estoque associado é excluído
- **THEN** o registro de `stock` correspondente é removido automaticamente pelo banco (cascade), sem lógica adicional no caso de uso de exclusão de produto

### Requirement: Repositório Prisma de `stock` sem métodos além do contrato padrão

O backend SHALL incluir uma implementação Prisma do repositório de `stock` em `apps/backend/src/modules/catalog`, respeitando exatamente a interface definida no módulo `catalog` (`create`, `update`, `delete`, `findById`, `findPage`), sem métodos adicionais.

#### Scenario: Repositório implementa contrato estável

- **WHEN** o repositório Prisma de `stock` é construído
- **THEN** ele fica em `apps/backend/src/modules/catalog/stock.prisma.ts`
- **AND** implementa a interface do módulo `catalog` sem alterá-la e sem métodos extra
- **AND** está registrado no módulo Nest com `DbModule` e `PrismaService`

### Requirement: `StockController` com CRUD completo em `/stock`

O backend SHALL incluir `apps/backend/src/modules/catalog/stock.controller.ts` expondo o CRUD completo: `POST /stock`, `PUT /stock/:id`, `DELETE /stock/:id`, `GET /stock/:id`, `GET /stock` (paginado). Todos os endpoints SHALL ser autenticados. Comandos (criar, atualizar, excluir) instanciam o caso de uso correspondente (`save-stock`/`delete-stock`) no corpo do método; consultas (obter por id, listar paginado) chamam o repositório diretamente.

#### Scenario: Endpoints presentes e autenticados

- **WHEN** `stock.controller.ts` é inspecionado
- **THEN** existem handlers para `POST`, `PUT /:id`, `DELETE /:id`, `GET /:id` e `GET` paginado em `/stock`
- **AND** nenhum deles está marcado como `@Public()`

#### Scenario: Acesso não autenticado bloqueado

- **WHEN** uma requisição sem JWT chega em qualquer endpoint de `/stock`
- **THEN** o backend responde com `401`

#### Scenario: Criação de estoque para produto que já tem estoque é rejeitada

- **WHEN** `POST /stock` é chamado com um `productId` que já possui um registro de estoque
- **THEN** o backend rejeita a operação com erro de conflito, sem sobrescrever o registro existente

#### Scenario: Atualização de quantidade

- **WHEN** o handler `PUT /stock/:id` é executado com uma nova `quantity` válida
- **THEN** o registro de estoque é atualizado com a nova quantidade

#### Scenario: Exclusão de estoque existente

- **WHEN** o handler `DELETE /stock/:id` é executado com um `id` existente
- **THEN** o registro de estoque é removido

### Requirement: Leitura (unitária e paginada) enriquecida com nome do produto via junção no controller

Tanto `GET /stock/:id` quanto `GET /stock` (paginado) SHALL resolver o nome do produto associado via `ProductRepository.findById(...)` (ambos os repositórios injetados como interfaces de domínio no controller), já que o frontend de edição precisa exibir o produto associado mesmo numa consulta pontual. Nenhuma implementação de repositório SHALL expor método fora do contrato padrão para essa finalidade.

#### Scenario: Nome do produto presente na listagem e na consulta pontual

- **WHEN** o handler `GET /stock` ou `GET /stock/:id` é executado
- **THEN** a resposta inclui o nome do produto, resolvido pelo controller via `ProductRepository.findById`

### Requirement: Mapeamento de leitura para objeto simples

Toda resposta de leitura do `StockController` SHALL ser construída explicitamente como objeto simples, contendo `{ id, productId, productName, quantity }`, tanto na listagem paginada quanto em `GET /stock/:id`.

#### Scenario: Listagem devolve objetos simples com nome do produto

- **WHEN** o handler `GET /stock` é executado
- **THEN** cada item da página é mapeado para `{ id, productId, productName, quantity }`
- **AND** a resposta inclui os metadados de paginação (`items`, `total`, `page`, `perPage`)

### Requirement: Cobertura HTTP em `stock.integration.http`

O backend SHALL incluir `apps/backend/src/modules/catalog/stock.integration.http` (Rest Client) cobrindo: criação válida, criação para produto que já tem estoque (conflito), listagem paginada (com nome do produto), obter por id, atualização de quantidade válida, atualização com quantidade negativa (erro), exclusão de estoque existente, atualização/exclusão de estoque inexistente (404), acesso sem JWT.

#### Scenario: Cenários de sucesso e erro presentes

- **WHEN** `stock.integration.http` é inspecionado
- **THEN** existem cenários de criação, atualização e exclusão válidas
- **AND** existe cenário de criação para produto que já tem estoque (conflito)
- **AND** existem cenários de quantidade negativa e estoque inexistente em update/delete
- **AND** existe cenário de listagem paginada com nome do produto e de acesso sem JWT
