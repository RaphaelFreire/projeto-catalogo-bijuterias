## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Context

O módulo `catalog` tem hoje um único agregado (`product`), entregue na change-005 replicando o template de CRUD da change-004 (`auth`/`user`). Esta change introduz os dois primeiros agregados relacionados a outro agregado do projeto (`category` e `stock`, ambos relacionados a `product`) e a primeira feature de upload/armazenamento de arquivo (galeria de imagens). Nenhum desses três padrões (FK entre agregados, orquestração entre casos de uso de agregados diferentes, upload de arquivo) tem precedente no projeto — as decisões abaixo fixam o padrão a ser reaproveitado por changes futuras.

Premissas e contratos herdados:

- Módulo `catalog` já existe com o agregado `product` (`modules/catalog/src/product`), incluindo entidade, repositório, `save-product`/`delete-product` e testes.
- `ProductController` (`apps/backend/src/modules/catalog/product.controller.ts`) instancia os casos de uso diretamente no corpo do método (`new SaveProduct(this.productRepository)`), injeta a classe Prisma concreta (não a interface do domínio) e mapeia respostas de leitura manualmente.
- **Delete é hard delete**: `PrismaProductRepository.delete` chama `prisma.product.delete(...)`, removendo a linha. O campo `deletedAt` existe na `Entity` base e no schema, mas não é usado por nenhuma lógica de exclusão hoje.
- `CrudRepository<TCreateData, TUpdateData, TEntity, TPageParams, TId = string>` (pacote compartilhado) define `create`, `update`, `delete(id)`, `findById(id)`, `findPage(params): PageResult<TItem>` (`{ items, page, perPage, total }`).
- Pacote compartilhado já tem todas as regras de validação necessárias: `RequiredRule`, `MinLengthRule`, `MaxLengthRule`, `MinValueRule`, `IntegerRule`, `UuidRule`, `UrlRule`, `MaxItemsRule` — nenhuma regra nova precisa ser criada.
- Frontend já tem `form-section-layout`, `delete-confirmation-dialog`, `pagination-controls`, `empty-list-state`, `AuthContext`/`AuthGuard`, e a sidebar é estendida via `APP_MODULES` em `app/(private)/layout.tsx`.
- Projeto está pré-produção (nenhum dado real em uso), o que permite migrations com colunas obrigatórias sem estratégia de backfill.

## Goals / Non-Goals

**Goals:**

- Entregar os agregados `category` e `stock` completos (entidade validada, contrato de repositório, casos de uso, testes), seguindo o mesmo template de `product`.
- Relacionar `product` a `category` (N:1, obrigatório) e a `stock` (1:1, ciclo de vida acoplado).
- Entregar galeria de imagens em `product` sem criar um agregado de domínio próprio para imagem.
- Fixar o padrão de orquestração entre agregados (criação de `stock` disparada pela criação de `product`) e o padrão de upload/armazenamento local de arquivo, reutilizáveis por changes futuras.

**Non-Goals:**

- Histórico de movimentação de estoque (entradas/saídas com motivo e data). Estoque nesta change é só a quantidade atual.
- Hierarquia de categorias (categoria/subcategoria) ou relação N:N (múltiplas categorias por produto).
- Armazenamento de imagem em nuvem (S3, R2, Supabase Storage). Armazenamento é em pasta local do backend.
- Redimensionamento/otimização de imagem (thumbnails gerados, compressão). Upload salva o arquivo como recebido.
- Upload de imagem durante a criação do produto. Galeria só é editável em modo edição (produto já existe).
- Roles/permissões finas — acesso continua binário (autenticado ou não), como no resto do projeto.

## Decisions

### Decisão 1: `category` é um agregado independente, com FK opcional em `product`

`Category { id, name }`. `Product.categoryId` é opcional (`UuidRule` aplicada somente quando o campo é informado), `null` quando ausente.

**Por quê:** O usuário definiu relação simples N:1 (produto pertence a uma categoria), não N:N nem hierarquia. Tornar o campo opcional evita bloquear a criação de produto quando ainda não existe nenhuma categoria cadastrada — reduz o acoplamento entre as duas telas nesta primeira entrega. Tornar obrigatório fica como evolução natural de uma change futura, se o negócio exigir.

**Trade-off:** Produtos sem categoria aparecem como "sem categoria" na UI (listagem e formulário). Se no futuro `categoryId` virar obrigatório, será necessário backfill dos produtos existentes — aceitável adiar essa decisão porque o projeto está pré-produção e o custo de mudar de opcional para obrigatório depois é baixo.

### Decisão 2: `stock` é um agregado independente, mas com ciclo de vida acoplado a `product`

`Stock { id, productId, quantity }`, com `productId` único (1:1) e FK `onDelete: Cascade` no Prisma.

**Por quê:** Modelar como agregado próprio (em vez de um campo em `Product`) mantém a listagem de estoque simples de consultar/paginar e isola a regra de quantidade (`IntegerRule`, `MinValueRule(0)`) sem inflar a entidade `Product`. Ao contrário da decisão inicial, o estoque **também** pode ser criado/excluído manualmente via HTTP (ver Decisão 3) — a criação automática na Decisão 2 é uma conveniência (todo produto novo já nasce com um registro de estoque zerado), não uma restrição de que só possa nascer assim.

**Como a orquestração acontece:** `ProductController.create` hoje instancia `SaveProduct` e retorna `void` sem conhecer o `id` gerado. Para poder criar o `stock` correspondente, o controller passa a gerar o `id` do produto **antes** de chamar os casos de uso (mesmo mecanismo já usado por `save-product`: se `id` vier no input e `findById` não encontrar, cria com aquele `id`). Sequência:

```
id = uuid()
new SaveProduct(productRepository).execute({ ...body, id })
new SaveStock(stockRepository).execute({ productId: id, quantity: 0 })
```

**Por quê esse mecanismo e não um serviço de orquestração à parte:** o projeto não tem camada de serviço entre controller e caso de uso — controllers já instanciam casos de uso diretamente no corpo do método. Introduzir uma camada nova só para esta orquestração quebraria o padrão estabelecido sem necessidade; duas chamadas sequenciais no controller são suficientes e legíveis.

**Exclusão em cascata:** como a exclusão de produto é hard delete, a FK `Stock.productId` usa `onDelete: Cascade` no Prisma — a exclusão do produto remove o registro de estoque automaticamente, sem precisar de lógica adicional em `DeleteProduct`.

### Decisão 3: `stock` expõe CRUD completo via HTTP, igual a `category` e `product`

`StockController` expõe os cinco endpoints padrão: `POST /stock`, `PUT /stock/:id`, `DELETE /stock/:id`, `GET /stock/:id`, `GET /stock` (paginado). Mesmo padrão de `ProductController`/`CategoryController`: comandos instanciam o caso de uso no corpo do método, consultas chamam o repositório direto.

**Por quê:** O usuário decidiu expor a superfície HTTP completa, não só leitura/atualização. Isso cobre cenários como recriar manualmente um registro de estoque removido, ou (futuramente) excluir o rastreamento de estoque de um produto sem apagar o produto em si. A criação automática de estoque ao criar produto (Decisão 2) continua acontecendo — o endpoint `POST /stock` manual é uma via adicional, não a única.

**Trade-off:** como `productId` é único (1:1), um `POST /stock` para um produto que já tem estoque deve ser tratado como erro (conflito), não como upsert silencioso — a spec de backend documenta esse caso.

### Decisão 4: leitura de estoque (listagem e unitária) com nome do produto — controller junta os dois repositórios de domínio

`StockController` injeta tanto `StockRepository` quanto `ProductRepository` (as interfaces de domínio já existentes). Tanto para a listagem paginada quanto para `GET /stock/:id`, o controller resolve o nome do produto via `productRepository.findById(...)`, montando o objeto de resposta `{ id, productId, productName, quantity }` manualmente. (Inicialmente `GET /stock/:id` não incluía `productName`, mas a implementação do frontend de edição — que exibe o produto associado como somente leitura — revelou que a consulta pontual também precisa dessa informação; corrigido para unificar o formato de resposta.)

**Por quê:** Evita adicionar um método fora do contrato de domínio só na implementação Prisma (o que a decisão anterior fazia). Os dois repositórios já existem e já expõem os métodos padrão necessários (`findPage`, `findById`) — não é preciso contrato novo nem classe concreta especial.

**Trade-off:** para uma página de N itens, isso é até N chamadas extra a `findById` (um lookup por linha, não uma única query com `JOIN`). Aceito no volume atual do catálogo (páginas pequenas); se o catálogo crescer e isso virar gargalo perceptível, uma change futura pode introduzir um método de leitura otimizado.

### Decisão 5: imagem não é agregado — é um campo `images: string[]` em `Product`, coluna nativa de array no Postgres

`Product.images` é `String[]` no Prisma (coluna de array nativo do Postgres — o projeto já usa tipos específicos do Postgres, como `@db.Decimal` em `price`). No domínio, a entidade `Product` guarda `images: string[]`, validado por `MaxItemsRule` (limite de itens na galeria) e cada item por `UrlRule`.

**Por quê:** O usuário decidiu explicitamente que imagem não tem agregado de domínio próprio — faz parte do `product`. Um array nativo evita criar uma tabela filha (`ProductImage`) só para guardar URLs ordenadas; a ordem de exibição é a ordem do array, e adicionar/remover imagem é atualizar o array inteiro.

**Trade-off:** sem tabela própria, cada imagem não tem `id` estável — remoção é feita por valor (a URL) ou por índice, não por um identificador dedicado. Aceitável para o volume esperado (poucas imagens por produto) e para o escopo desta change (sem reordenação drag-and-drop, sem metadados por imagem como "imagem principal").

### Decisão 6: upload salva em pasta local do backend, servida estaticamente, URL absoluta

Arquivo enviado via `POST /products/:id/images` (multipart, um arquivo por chamada) é salvo em `apps/backend/uploads/products/<productId>/<uuid>.<ext>` e servido estaticamente sob o prefixo `/uploads` via `NestExpressApplication.useStaticAssets` (sem adicionar `@nestjs/serve-static`, reaproveitando o `@nestjs/platform-express` já presente). A URL retornada (e persistida em `Product.images`) é **absoluta**, montada a partir do host da própria requisição (`${request.protocol}://${request.get('host')}/uploads/products/<productId>/<uuid>.<ext>`) — o frontend usa a URL diretamente, sem montar `src` a partir de uma origem separada.

**Por quê:** Decisão explícita do usuário (pasta local, não S3/nuvem). Um arquivo por chamada mantém o endpoint simples; o frontend chama a rota uma vez por imagem selecionada e acrescenta a URL retornada à galeria em tela.

**Correção descoberta durante a implementação:** a ideia original era persistir um path relativo (`/uploads/...`) e deixar o frontend compor a origem. Isso quebra a validação de `Product.images`, que usa `UrlRule` — essa regra exige URL absoluta `http(s)` (`new URL(value)` com protocolo `http:`/`https:`), e um path relativo falha nessa validação. Confirmado via teste manual (upload retornava `422 product.images.url`). Corrigido para montar a URL absoluta a partir do host da requisição, sem precisar de variável de ambiente nova nem enfraquecer a validação.

**Trade-off:** pasta local não sobrevive a múltiplas instâncias/deploys efêmeros (containers sem volume persistente) — aceitável para o estágio atual do projeto (pré-produção, ambiente único). Migração para storage em nuvem fica para change futura se necessário.

### Decisão 7: remoção de imagem apaga o arquivo do disco

`DELETE /products/:id/images` (corpo com a `url` a remover) remove a URL da lista `images` do produto **e** apaga o arquivo físico correspondente na pasta de upload.

**Por quê:** Evita acumular arquivos órfãos indefinidamente no disco local, já que não há um processo de limpeza agendado nesta change.

**Risco aceito:** se a remoção do arquivo falhar (ex.: já removido manualmente), a atualização da lista `images` não deve ser bloqueada — o erro de I/O é logado, não propagado como falha da operação.

### Decisão 8: galeria de imagens só é editável em modo edição

A seção "Imagens" do formulário de produto só aparece (ou só fica habilitada) quando `mode === 'edit'`, já que o upload depende de um `productId` existente.

**Por quê:** Consistente com a Decisão 6 (endpoint é `/products/:id/images`, exige produto já criado). Evita a complexidade de upload para um produto "rascunho" ainda não persistido (ex.: staging de arquivo antes do primeiro save).

### Decisão 9: capabilities separadas por camada, replicando o padrão das changes anteriores

Seis capabilities novas (`catalog-category-{domain,backend,frontend}`, `catalog-stock-{domain,backend,frontend}`) e três capabilities modificadas (`catalog-product-{domain,backend,frontend}`).

**Por quê:** Mesma granularidade de change-004 e change-005 — cada camada com requisitos verificáveis distintos, reaproveitando o template para os próximos cadastros do projeto.

## Risks / Trade-offs

- **`categoryId` opcional permite produtos "sem categoria" indefinidamente** → Mitigação: aceito nesta change; se o negócio exigir categoria obrigatória depois, migrar para `NOT NULL` com backfill dos produtos existentes é uma change futura pequena.
- **Array nativo do Postgres para `images` não tem `id` por item** → Mitigação: aceito para o volume esperado; revisar se o produto exigir metadados por imagem no futuro (imagem principal, alt text, etc.).
- **Pasta local de upload não é persistente/escalável entre instâncias** → Mitigação: aceito para o estágio atual (ambiente único, pré-produção); migração para storage em nuvem é uma change futura, não um retrabalho estrutural (a URL pública já é abstraída do endpoint de upload).
- **Arquivos órfãos se a remoção de imagem falhar parcialmente, ou se um produto for excluído sem remover seus arquivos primeiro** → Mitigação: aceito nesta change (hard delete de produto não limpa arquivos associados); registrar como débito técnico para uma rotina de limpeza futura.
- **`POST /stock` para produto que já tem estoque (viola unicidade de `productId`)** → Mitigação: tratado como erro de conflito, não como upsert silencioso (ver Decisão 3).
- **Listagem de estoque com N chamadas extra a `findById` por página** → Mitigação: aceito no volume atual do catálogo; revisar se o catálogo crescer (ver Decisão 4).
- **Sem testes automatizados de UI** → Mitigação: mesma decisão das changes anteriores; usuário valida manualmente, backend coberto por unit + Rest Client.

## Migration Plan

Não há sistema em produção. Entrega incremental, na ordem abaixo (cada bloco depende do anterior):

1. **Domínio `category`**: agregado, entidade, repositório, `save-category`/`delete-category`, testes.
2. **Domínio `stock`**: agregado, entidade, repositório, `save-stock`/`delete-stock`, testes.
3. **Domínio `product` (extensão)**: adicionar `categoryId` e `images` à entidade `Product`, com validações (`UuidRule`, `MaxItemsRule`, `UrlRule` por item).
4. **Backend `category`**: sincronizar Prisma, repositório Prisma, `CategoryController`, `category.integration.http`.
5. **Backend `stock`**: sincronizar Prisma (com `onDelete: Cascade` em `productId`), repositório Prisma (sem métodos extra além do contrato padrão), `StockController` (CRUD completo, com listagem enriquecida montada no próprio controller via `StockRepository` + `ProductRepository`), `stock.integration.http`.
6. **Backend `product` (extensão)**: estender model Prisma (`categoryId`, `images`), orquestrar criação de `stock` em `ProductController.create`, configurar pasta de upload + serving estático, endpoints `POST/DELETE /products/:id/images`.
7. **Frontend `category`**: listagem, formulário, item de menu "Categorias", i18n.
8. **Frontend `stock`**: listagem com ações de criar/editar/excluir, item de menu "Estoque", i18n.
9. **Frontend `product` (extensão)**: select de categoria no formulário, seção "Imagens" (upload múltiplo, miniaturas, remoção) habilitada em modo edição, i18n.
10. Rodar `npx tsc --noEmit` no frontend e sinalizar ao usuário para conferência manual.

Rollback: descartar a branch.

## Open Questions

- Limite máximo de imagens por produto (`MaxItemsRule`) — sugestão inicial de 8, a confirmar durante a implementação (não bloqueia o desenho, é um parâmetro).
- Nenhuma outra pendência: as decisões desta change cobrem a orquestração produto↔estoque, a estratégia de armazenamento local de imagem e a estrutura de dados da galeria, conforme solicitado.
