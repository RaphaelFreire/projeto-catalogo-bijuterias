# catalog-banner-backend Specification

## Purpose
TBD - created by change-008-vitrine-marca-banners-busca. Update Purpose after archive.

## Requirements

### Requirement: Model Prisma de `banner` sincronizado, com FK opcional para `Category` e `linkUrl` opcional

O backend SHALL incluir o model Prisma de `banner` em `apps/backend/prisma/models/catalog.model.prisma`, sincronizado com a entidade `Banner`, com `categoryId` como foreign key **opcional** (nullable) para `Category` (sem cascade — exclusão de categoria com banners associados falha por restrição de integridade, mesmo comportamento default já usado por `Product.categoryId`) e `linkUrl` (nullable).

#### Scenario: Model sincronizado e migration aplicada

- **WHEN** o módulo `catalog` é sincronizado com o Prisma do backend
- **THEN** existe o model `banner` em `catalog.model.prisma` com os campos `imageUrl`, `position`, `categoryId` (FK opcional) e `linkUrl` (opcional)
- **AND** uma migration nomeada por módulo é gerada e aplicada

#### Scenario: Exclusão de categoria com banner associado é bloqueada

- **WHEN** uma categoria referenciada por um banner (com destino `categoryId`) é excluída
- **THEN** a exclusão falha por restrição de integridade referencial

### Requirement: Repositório Prisma de `banner`

O backend SHALL incluir uma implementação Prisma do repositório de `banner` em `apps/backend/src/modules/catalog`, respeitando a interface definida no módulo `catalog`, sem métodos além do contrato padrão.

#### Scenario: Repositório implementa contrato estável

- **WHEN** o repositório Prisma de `banner` é construído
- **THEN** ele fica em `apps/backend/src/modules/settings/banner/banner.prisma.ts`
- **AND** implementa a interface do módulo `catalog` sem alterá-la
- **AND** está registrado no módulo Nest com `DbModule` e `PrismaService`

### Requirement: `BannerController` com CRUD autenticado em `/banners`

O backend SHALL incluir `apps/backend/src/modules/settings/banner/banner.controller.ts` expondo o CRUD completo em `/banners` (criar, atualizar, excluir, obter por id, listar — ordenado por `position` ascendente), autenticado (sem `@Public()`). Comandos (criar, atualizar, excluir) instanciam o caso de uso correspondente no corpo do método; consultas chamam o repositório diretamente.

#### Scenario: Endpoints presentes e autenticados

- **WHEN** `banner.controller.ts` é inspecionado
- **THEN** existem handlers para criar, atualizar, excluir, obter por id e listar em `/banners`
- **AND** nenhum deles está marcado como `@Public()`

#### Scenario: Listagem ordenada por posição

- **WHEN** `GET /banners` é executado
- **THEN** os banners retornados vêm ordenados por `position` ascendente

#### Scenario: Criação rejeitada ao exceder 3 banners

- **WHEN** `POST /banners` é chamado com 3 banners já cadastrados
- **THEN** o backend responde com `422` e `errors[]` inclui `banner.max_reached`

#### Scenario: Criação aceita `categoryId` ou `linkUrl` como destino

- **WHEN** `POST /banners` é chamado apenas com `linkUrl` (sem `categoryId`)
- **THEN** o backend cria o banner normalmente, com `categoryId` valendo `null`

#### Scenario: Criação rejeita destino ausente ou duplicado

- **WHEN** `POST /banners` é chamado sem `categoryId` e sem `linkUrl`
- **THEN** o backend responde com `422` e `errors[]` inclui `banner.destination.required`
- **WHEN** `POST /banners` é chamado com `categoryId` e `linkUrl` ao mesmo tempo
- **THEN** o backend responde com `422` e `errors[]` inclui `banner.destination.exclusive`

#### Scenario: Acesso não autenticado bloqueado

- **WHEN** uma requisição sem JWT chega em qualquer endpoint de `/banners`
- **THEN** o backend responde com `401`

### Requirement: Upload de imagem do banner é standalone, sem exigir um banner já existente

Como `imageUrl` é obrigatória na entidade `Banner`, o backend SHALL expor `POST /banners/upload-image` (multipart, autenticado, **sem** `:id` na rota), que apenas salva o arquivo em `apps/backend/uploads/banners/<uuid>.<ext>` (servido estaticamente sob `/uploads`, com a URL **absoluta** montada a partir do host da requisição — mesma técnica de `product.controller.ts`) e retorna `{ imageUrl }`, sem interagir com nenhum registro de `banner`. O mesmo endpoint SHALL ser usado tanto para criar um banner novo (upload primeiro, depois `POST /banners` com a `imageUrl` já resolvida) quanto para trocar a imagem de um banner existente (upload, depois `PUT /banners/:id` com a nova `imageUrl`).

#### Scenario: Upload devolve a URL sem exigir banner existente

- **WHEN** um arquivo válido é enviado para `POST /banners/upload-image`, mesmo sem nenhum banner ainda criado
- **THEN** o arquivo é salvo na pasta local de uploads
- **AND** a resposta contém `{ imageUrl }` com a URL absoluta do arquivo

#### Scenario: Criação de produto usa a URL já resolvida pelo upload

- **WHEN** o frontend cria um banner novo enviando `imageUrl` obtida de um upload anterior
- **THEN** o banner é criado normalmente, sem chamada adicional de upload

### Requirement: Mapeamento de leitura para objeto simples

Toda resposta de leitura do `BannerController` SHALL ser construída explicitamente como objeto simples, contendo `{ id, imageUrl, position, categoryId, linkUrl }`. O mesmo formato SHALL ser usado por `GET /storefront/banners`.

#### Scenario: Listagem e obtenção por id devolvem objetos simples

- **WHEN** os handlers de leitura são executados
- **THEN** cada banner é mapeado para `{ id, imageUrl, position, categoryId, linkUrl }`

### Requirement: Cobertura HTTP em `banner.integration.http`

O backend SHALL incluir `apps/backend/src/modules/settings/banner/banner.integration.http` (Rest Client) cobrindo: criação válida (destino categoria e destino link), criação rejeitada ao exceder 3 banners (422), destino ausente e destino duplicado (422), atualização válida (incluindo atualização com 3 banners já existentes, não bloqueada), exclusão de banner existente, exclusão/atualização de banner inexistente (404), `categoryId` referenciando categoria inexistente, upload de imagem, listagem ordenada por `position`, acesso sem JWT (401).

#### Scenario: Cenários de sucesso e erro presentes

- **WHEN** `banner.integration.http` é inspecionado
- **THEN** existem cenários de criação/atualização/exclusão válidas
- **AND** existe cenário de criação rejeitada ao exceder o limite
- **AND** existem cenários de banner inexistente (404), categoria inexistente, upload de imagem e acesso sem JWT
