# catalog-product-backend Specification

## Purpose
TBD - created by archiving change change-005-cadastro-produto. Extended by change-006-catalogo-categoria-estoque-imagem (categoria, orquestração de estoque, imagens) e change-007-vitrine-publica-whatsapp (renomeação dos flags de marketing, quantidade em estoque no formulário de produto, upload de imagem em modo criação). Update Purpose after archive.

## Requirements

### Requirement: Model Prisma de `product` sincronizado

O backend SHALL incluir/atualizar o model Prisma de `product` em `apps/backend/prisma/models/catalog.model.prisma`, sincronizado com a entidade `Product` do módulo `catalog`, com migration incremental aplicada. O model SHALL incluir `categoryId` (foreign key opcional/nullable para `Category`) e `images` (`String[]`, array nativo do Postgres).

#### Scenario: Model sincronizado e migration aplicada

- **WHEN** o módulo `catalog` é sincronizado com o Prisma do backend
- **THEN** existe `apps/backend/prisma/models/catalog.model.prisma` com o model `product`
- **AND** uma migration nomeada por módulo é gerada e aplicada
- **AND** o schema reflete os campos `name`, `description (nullable)`, `price`, `status`, `bestSeller`, `dailyDeal`, `lastUnits`, `categoryId` (FK opcional/nullable) e `images` (array)

**Nota de renomeação:** as colunas `bestSeller`/`dailyDeal`/`lastUnits` correspondem às antigas `availableOnline`/`featured`/`allowsPreOrder` (change-005/006). A migration desta change SHALL renomear as colunas existentes (`RENAME COLUMN`), preservando os dados já persistidos — NÃO PODE remover e recriar as colunas.

### Requirement: Repositório Prisma de `product`

O backend SHALL incluir uma implementação Prisma do repositório de `product` em `apps/backend/src/modules/catalog`, respeitando a interface definida no módulo `catalog`, mapeando `categoryId` e `images` em todas as operações (`create`, `update`, `findById`, `findPage`).

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

### Requirement: Criação de produto orquestra criação de estoque associado, com quantidade inicial opcional

O handler de criação (`POST /products`) SHALL gerar o `id` do produto (usando o `id` recebido no corpo, se houver, ou gerando um novo) antes de invocar `SaveProduct`, e em seguida SHALL instanciar `SaveStock` criando o registro de `stock` correspondente (`productId` igual ao `id` do produto recém-criado). O corpo da requisição PODE incluir um campo `quantity` (número inteiro, não-negativo) — quando informado, SHALL ser usado como quantidade inicial do estoque; quando ausente, a quantidade inicial SHALL ser `0`. Se a criação do produto falhar, o estoque NÃO PODE ser criado. O endpoint SHALL retornar `{ id }` no corpo da resposta (necessário para o frontend anexar imagens ao produto recém-criado antes de navegar para a listagem).

#### Scenario: Estoque nasce junto com o produto, sem quantidade informada

- **WHEN** um produto é criado com sucesso via `POST /products` sem o campo `quantity`
- **THEN** um registro de `stock` é criado com o mesmo `productId` e `quantity` igual a `0`
- **AND** a resposta contém `{ id }` com o id do produto criado

#### Scenario: Estoque nasce com quantidade inicial informada

- **WHEN** um produto é criado via `POST /products` com `quantity: 25`
- **THEN** o registro de `stock` criado tem `quantity` igual a `25`

#### Scenario: Falha na criação do produto não cria estoque

- **WHEN** a criação do produto falha (ex.: validação)
- **THEN** nenhum registro de `stock` é criado

### Requirement: Atualização de produto pode atualizar a quantidade em estoque associada

O handler de atualização (`PUT /products/:id`) PODE receber um campo `quantity` no corpo. Quando informado, o controller SHALL localizar o registro de `stock` associado ao produto (via `StockRepository.findByProductId`) e SHALL atualizar sua quantidade através do caso de uso `save-stock`, usando o `id` do estoque já existente (nunca criando um segundo registro de estoque para o mesmo produto). Quando `quantity` não é informado, o estoque associado NÃO PODE ser alterado.

#### Scenario: Atualização altera a quantidade do estoque existente

- **WHEN** `PUT /products/:id` é chamado com `quantity: 40` para um produto que já tem estoque
- **THEN** o registro de estoque existente é atualizado para `quantity: 40`
- **AND** nenhum novo registro de estoque é criado

#### Scenario: Atualização sem `quantity` não altera o estoque

- **WHEN** `PUT /products/:id` é chamado sem o campo `quantity`
- **THEN** o registro de estoque associado permanece com a quantidade anterior

### Requirement: Leitura de produto enriquecida com a quantidade em estoque

Tanto `GET /products/:id` quanto a listagem paginada (`GET /products`) SHALL incluir o campo `quantity`, resolvido a partir do registro de `stock` associado ao produto via `StockRepository.findByProductId` (o mesmo padrão de junção já usado por `catalog-stock-backend` para resolver `productName`). Quando não existir estoque associado (caso excepcional), `quantity` SHALL valer `0`.

#### Scenario: Quantidade presente na consulta pontual e na listagem

- **WHEN** o handler de obter por id ou de listar paginado é executado
- **THEN** cada produto retornado inclui `quantity`, resolvida a partir do estoque associado

### Requirement: Mapeamento de leitura para objeto simples

Toda resposta de leitura do `ProductController` SHALL ser construída explicitamente como objeto simples no controller, contendo todos os campos públicos: `{ id, name, description, price, status, bestSeller, dailyDeal, lastUnits, categoryId, images, quantity }`. Entidades de domínio NÃO PODEM ser retornadas diretamente (getters de prototype não serializam via `JSON.stringify`).

#### Scenario: Obter por id devolve objeto simples completo

- **WHEN** o handler de obter por id é executado com sucesso
- **THEN** o controller retorna explicitamente `{ id, name, description, price, status, bestSeller, dailyDeal, lastUnits, categoryId, images, quantity }`
- **AND** não retorna a entidade direta

#### Scenario: Listagem devolve objetos simples

- **WHEN** o handler de listagem paginada é executado
- **THEN** cada item da página é mapeado para o objeto simples acima
- **AND** a resposta inclui também os metadados de paginação (`items`, `total`, `page`, `perPage`)

### Requirement: Upload de imagem salvo em pasta local, servido estaticamente, permitido em modo criação

O backend SHALL expor `POST /products/:id/images` (multipart, um arquivo por chamada), salvando o arquivo em `apps/backend/uploads/products/<productId>/<uuid>.<ext>` e servindo a pasta de uploads estaticamente sob o prefixo `/uploads`. Após salvar, a URL **absoluta** do arquivo (montada a partir do host da requisição, já que `Product.images` valida cada item com `UrlRule`, que exige URL `http(s)` absoluta) SHALL ser acrescentada à lista `images` do produto e persistida. O endpoint SHALL retornar a lista `images` atualizada. Como `POST /products` agora aceita um `id` vindo do cliente, o frontend PODE criar o produto informando o `id` e, em seguida, chamar este endpoint imediatamente — sem depender de um passo de edição separado.

#### Scenario: Upload adiciona imagem à galeria

- **WHEN** um arquivo válido é enviado para `POST /products/:id/images`
- **THEN** o arquivo é salvo na pasta local de uploads
- **AND** a URL absoluta é acrescentada à lista `images` do produto
- **AND** a resposta contém a lista `images` atualizada

#### Scenario: Limite de imagens excedido

- **WHEN** o upload faria a lista `images` exceder o limite máximo de itens
- **THEN** o backend rejeita a operação com erro de validação, sem salvar o arquivo

### Requirement: Remoção de imagem apaga o arquivo do disco

O backend SHALL expor `DELETE /products/:id/images` (corpo contendo a `url` a remover), removendo a URL da lista `images` do produto e apagando o arquivo físico correspondente na pasta de uploads. Falha ao apagar o arquivo físico NÃO PODE bloquear a atualização da lista `images` (é registrada em log).

#### Scenario: Remoção bem-sucedida

- **WHEN** uma `url` existente na galeria é enviada para `DELETE /products/:id/images`
- **THEN** a URL é removida da lista `images` do produto
- **AND** o arquivo físico correspondente é apagado da pasta de uploads

#### Scenario: Falha ao apagar arquivo não bloqueia a remoção lógica

- **WHEN** o arquivo físico já não existe no disco no momento da remoção
- **THEN** a URL ainda é removida da lista `images` do produto
- **AND** o erro de I/O é registrado em log, sem falhar a requisição

### Requirement: Cobertura HTTP em `product.integration.http`

O backend SHALL incluir/atualizar `apps/backend/src/modules/catalog/product.integration.http` (Rest Client) cobrindo os fluxos do CRUD e os principais casos de erro: criação válida sem categoria (verificando que o estoque nasce junto com `quantity: 0`), criação com `quantity` informada, criação válida com categoria, criação com nome inválido, criação com preço negativo, criação com status fora do enum, criação com `categoryId` referenciando categoria inexistente, atualização válida (incluindo atualização de `quantity`), exclusão de produto existente, exclusão de produto inexistente (404), atualização de produto inexistente, obter por id (incluindo `quantity`), listagem paginada, acesso sem JWT, upload de imagem, remoção de imagem, upload excedendo o limite de imagens.

#### Scenario: Cenários de sucesso e erro presentes

- **WHEN** `product.integration.http` é inspecionado
- **THEN** existem cenários de criação/atualização/exclusão válidas, com e sem `categoryId` e com e sem `quantity`
- **AND** existem cenários para nome inválido, preço negativo, status fora do enum, `categoryId` referenciando categoria inexistente
- **AND** existem cenários para produto inexistente em update e delete (404)
- **AND** existe cenário de listagem paginada
- **AND** existe cenário para acesso sem JWT
- **AND** existem cenários de upload de imagem, remoção de imagem e limite de imagens excedido
