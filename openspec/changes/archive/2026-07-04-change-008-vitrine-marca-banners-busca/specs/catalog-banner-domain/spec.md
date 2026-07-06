# catalog-banner-domain Specification

## Purpose
TBD - created by change-008-vitrine-marca-banners-busca. Update Purpose after archive.

## Requirements

### Requirement: Agregado `banner` no módulo `catalog`

O módulo `catalog` SHALL incluir o agregado `banner` com a estrutura padrão de pastas para entidade, repositório e casos de uso.

#### Scenario: Estrutura do agregado presente

- **WHEN** o módulo `catalog` é inspecionado após esta change
- **THEN** existe o agregado `banner` com a estrutura padrão (entidade, repositório, casos de uso)

### Requirement: Entidade `Banner` validada, com destino mutuamente exclusivo entre categoria e link

O agregado `banner` SHALL definir a entidade `Banner` com os campos `imageUrl` (string, required, validado como URL absoluta com `UrlRule`), `position` (number, required, inteiro, min-value 0), `categoryId` (string | null, opcional, formato uuid quando informado) e `linkUrl` (string | null, opcional, URL absoluta quando informado). O destino do banner SHALL ser exatamente um dos dois: `categoryId` (referência a uma `category`) ou `linkUrl` (link externo/arbitrário) — nunca os dois preenchidos, nunca os dois ausentes.

#### Scenario: Criação com dados válidos, destino categoria

- **WHEN** uma entidade `Banner` é instanciada com `imageUrl`, `position` e `categoryId` válidos, sem `linkUrl`
- **THEN** a entidade é criada sem erros
- **AND** `linkUrl` vale `null`

#### Scenario: Criação com dados válidos, destino link

- **WHEN** uma entidade `Banner` é instanciada com `imageUrl`, `position` e `linkUrl` válidos, sem `categoryId`
- **THEN** a entidade é criada sem erros
- **AND** `categoryId` vale `null`

#### Scenario: Validação de `imageUrl`

- **WHEN** `Banner` é instanciado com `imageUrl` ausente ou que não é uma URL válida
- **THEN** a criação falha com erro de validação correspondente

#### Scenario: Validação de `position`

- **WHEN** `Banner` é instanciado com `position` ausente, negativa ou não inteira
- **THEN** a criação falha com erro de validação correspondente

#### Scenario: Validação de `categoryId` e `linkUrl` quando informados

- **WHEN** `Banner` é instanciado com `categoryId` informado, mas fora do formato uuid
- **THEN** a criação falha com erro de validação correspondente
- **WHEN** `Banner` é instanciado com `linkUrl` informado, mas que não é uma URL válida
- **THEN** a criação falha com erro de validação correspondente

#### Scenario: Destino ausente é rejeitado

- **WHEN** `Banner` é instanciado sem `categoryId` e sem `linkUrl`
- **THEN** a criação falha com erro de validação `banner.destination.required`

#### Scenario: Destino duplicado é rejeitado

- **WHEN** `Banner` é instanciado com `categoryId` e `linkUrl` informados ao mesmo tempo
- **THEN** a criação falha com erro de validação `banner.destination.exclusive`

### Requirement: Contrato do repositório de `banner`

O agregado `banner` SHALL expor uma interface de repositório no módulo `catalog` cobrindo as operações necessárias para o CRUD: persistir (criar/atualizar), excluir por id, buscar por id e listar paginado. Esta interface NÃO PODE ser alterada por implementações técnicas.

#### Scenario: Contrato cobre operações do CRUD

- **WHEN** o contrato é inspecionado
- **THEN** ele expõe operações para persistir, excluir por id, buscar por id e listar paginado

### Requirement: Caso de uso `save-banner` com limite de 3 banners na criação

O agregado `banner` SHALL implementar o caso de uso `save-banner`, retornando `void`, com decisão entre criar e atualizar baseada em `findById`: se `id` vier na entrada e `findById` retornar um registro, atualiza; caso contrário, cria usando o `id` recebido ou gerando um novo. **Apenas no fluxo de criação**, antes de persistir, o caso de uso SHALL consultar o total de banners existentes (via `findPage`) e, se já houver 3 ou mais, SHALL lançar `DomainError("banner.max_reached", 422)` sem criar o novo registro. A atualização de um banner existente NÃO PODE ser bloqueada por essa regra.

#### Scenario: Criação sem `id`, dentro do limite

- **WHEN** `save-banner` é chamado sem `id` e existem menos de 3 banners
- **THEN** uma nova entidade é criada com `id` gerado e persistida

#### Scenario: Criação rejeitada ao exceder o limite

- **WHEN** `save-banner` é chamado sem `id` (ou com `id` inexistente) e já existem 3 banners
- **THEN** o caso de uso lança `DomainError("banner.max_reached", 422)`
- **AND** nenhum registro é criado

#### Scenario: Atualização não é bloqueada pelo limite

- **WHEN** `save-banner` é chamado com `id` de um banner já existente, mesmo havendo 3 banners no total
- **THEN** os campos do banner são atualizados e persistidos normalmente

### Requirement: Caso de uso `delete-banner`

O agregado `banner` SHALL implementar o caso de uso `delete-banner`, retornando `void`. Quando o `id` informado não existir, SHALL lançar `DomainError("banner.not_found", 404)`.

#### Scenario: Exclusão de banner existente

- **WHEN** `delete-banner` é chamado com `id` existente
- **THEN** o banner é removido do repositório

#### Scenario: Banner inexistente

- **WHEN** `delete-banner` é chamado com `id` inexistente
- **THEN** o caso de uso lança `DomainError("banner.not_found", 404)`
- **AND** nada é alterado no repositório

### Requirement: Cobertura por testes unitários

Os casos de uso `save-banner` e `delete-banner` SHALL ter cobertura por testes unitários usando os fakes do módulo (`FakeBannerRepository` e demais providers necessários). Cenários mínimos: criação sem id dentro do limite, criação rejeitada ao exceder 3 banners, atualização não bloqueada pelo limite, exclusão de banner existente, exclusão de banner inexistente, validações principais (`imageUrl` inválida, `position` negativa, `categoryId`/`linkUrl` inválidos), criação com `linkUrl` como destino, destino ausente rejeitado, destino duplicado (`categoryId` + `linkUrl`) rejeitado, atualização trocando o destino de categoria para link.

#### Scenario: Cenários presentes nos testes

- **WHEN** os testes unitários dos casos de uso são executados
- **THEN** os cenários listados acima estão presentes
