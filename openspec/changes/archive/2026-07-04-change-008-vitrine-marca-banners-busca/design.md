## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Context

A vitrine pública (`/loja`) e o módulo `settings` já existem desde a change-007. Esta change adiciona três pedaços de "vitrine profissional" — logo, banners, busca/filtro — sem tocar em estoque, pedido ou checkout (isso é escopo da change-009, deliberadamente separada por ter um perfil de risco diferente: transação e concorrência).

Premissas herdadas:

- Upload de imagem local já existe (change-006/007): pasta local no backend, servida estaticamente sob `/uploads`, URL **absoluta** montada a partir do host da requisição (`${request.protocol}://${request.get('host')}/...`) — necessário porque o pacote compartilhado valida imagens com `UrlRule`, que exige URL `http(s)` absoluta.
- `store-settings` é um agregado singleton (`STORE_SETTINGS_ID` fixo), com `GET /settings` público e `PUT /settings` autenticado.
- `category` já é um agregado CRUD completo (change-006), com tela admin própria — banner referencia `category` por `categoryId`.
- `GET /storefront/products` devolve todos os produtos ativos de uma vez (até 500, sem paginação) — decisão da change-007, mantida aqui.
- O projeto evita novas dependências quando uma solução simples já resolve (ex.: upload sem `@nestjs/serve-static`, usando `NestExpressApplication.useStaticAssets` direto).

## Goals / Non-Goals

**Goals:**

- Logo configurável pela loja, refletida no header da vitrine.
- Até 3 banners, cada um linkando para uma categoria, exibidos em destaque na vitrine.
- Busca e filtro de categoria na vitrine, sem exigir mudança de backend (client-side sobre a lista já carregada).

**Non-Goals:**

- Estoque, desconto automático, pedido, checkout — change-009.
- Banner apontando para uma lista curada de produtos específicos (decisão do usuário: destino é sempre uma categoria, não uma seleção de produtos).
- Drag-and-drop de verdade para reordenar banners — usa botões subir/descer (ver Decisão 4), evitando adicionar uma biblioteca de DnD para no máximo 3 itens.
- Carrossel automático (autoplay) — o carrossel de banners é navegação manual/scroll, não rotação por tempo.
- Paginação ou busca server-side na vitrine — o volume continua pequeno (mesma premissa da change-007).

## Decisions

### Decisão 1: `logoUrl` opcional no `store-settings`, mesmo padrão de upload de produto

`StoreSettings.logoUrl` é `string | null`, validado com `UrlRule` apenas quando informado (sem `RequiredRule`, ao contrário de `whatsappNumber`). Upload via `POST /settings/logo` (multipart, autenticado), salvando em `apps/backend/uploads/settings/<uuid>.<ext>`, servido pelo mesmo `useStaticAssets` já configurado. Ao enviar uma nova logo com uma já existente, o arquivo antigo é apagado do disco (mesma tolerância a falha de I/O do upload de produto — loga e não bloqueia). `DELETE /settings/logo` remove a URL e o arquivo.

**Por quê:** Reaproveita 100% da infraestrutura já validada (change-006/007), sem nenhuma decisão nova de armazenamento. Como é um valor único (não uma lista, ao contrário de `Product.images`), cada upload novo substitui o anterior — não acumula.

**Revisão pós-implementação:** a primeira versão desta decisão herdava a regra de que `whatsappNumber` era obrigatório no agregado singleton, o que bloqueava o upload de logo (`422 settings.whatsappNumber.required`) antes de o WhatsApp já ter sido configurado — um acoplamento artificial entre dois requisitos independentes (ter uma logo não deveria depender de já ter um WhatsApp configurado). Corrigido: `whatsappNumber` deixou de ser obrigatório no agregado `store-settings` (`RequiredRule` removida, mantendo `PhoneRule` — validado apenas quando informado, mesmo tratamento já dado a `logoUrl`). `save-store-settings` agora trata os dois campos de forma simétrica: cada um é atualizado independentemente quando informado, e preservado quando omitido. O endpoint `POST /settings/logo` não depende mais de `whatsappNumber` já existir. A obrigatoriedade de preencher o WhatsApp continua existindo apenas como recomendação de UX no formulário (`required` no campo), não como regra de domínio — o negócio real ("a loja precisa de um WhatsApp configurado para receber pedidos") é verificado no momento do checkout (`storefront.whatsappNumber.not_configured`), não no momento de salvar a configuração.

### Decisão 2: `banner` é um agregado novo no módulo `catalog`, com destino obrigatório (categoria ou link, mutuamente exclusivos)

`Banner { id, imageUrl, position, categoryId, linkUrl }`. O único propósito do banner é linkar para algum lugar, então não faz sentido existir sem destino — mas o destino pode ser tanto uma `category` do catálogo quanto um link (URL) arbitrário. `categoryId` e `linkUrl` são ambos opcionais (`string | null`) no nível do campo individual, mas a entidade exige que **exatamente um** dos dois esteja preenchido: nenhum (`banner.destination.required`) e os dois juntos (`banner.destination.exclusive`) são rejeitados na validação.

**Por quê:** Decisão original do usuário limitava o destino a categoria (não uma lista curada de produtos, que exigiria uma relação N:N banner↔produto e uma UI de seleção — descartado como Non-Goal). **Revisão posterior**: o usuário pediu explicitamente a possibilidade de um link de URL como destino também (ex.: linkar para um número de WhatsApp, uma página externa, uma promoção fora do catálogo) — não só uma categoria interna. Em vez de adicionar `linkUrl` como um terceiro campo independente (o que permitiria estados ambíguos, como um banner com categoria E link ao mesmo tempo, sem definição de qual prevalece), o destino foi modelado como uma escolha mutuamente exclusiva entre os dois, validada na entidade (mesmo padrão de `ValidationException` já usado por `Validator.validate`, mas aplicado manualmente após a validação campo-a-campo, já que é uma regra cross-field).

### Decisão 3: máximo de 3 banners, verificado via `findPage` (sem método novo no contrato)

`save-banner`, no fluxo de **criação** (não atualização), chama `bannerRepository.findPage({ page: 1, perPage: 1 })` e verifica o campo `total` do resultado — se já houver 3 ou mais, lança `DomainError("banner.max_reached", 422)` sem persistir. Atualizar um banner existente nunca é bloqueado por essa regra.

**Por quê:** `findPage` já retorna `total` como parte do `PageResult` padrão (contrato `CrudRepository` já usado por todo agregado do projeto) — não precisa de um método `count()` novo no contrato de domínio só para isso. Reaproveita o que já existe.

### Decisão 4: reordenação via posição explícita e botões subir/descer, sem biblioteca de drag-and-drop

`position` é um campo obrigatório da entidade (inteiro, `min-value 0`), definido pelo frontend: ao criar um banner, `position` recebe o total atual de banners (aparece no fim da lista); a tela de listagem tem botões "subir"/"descer" por linha que trocam a `position` entre o banner e seu vizinho (dois `PUT /banners/:id`, um por banner afetado).

**Por quê:** Com no máximo 3 itens, uma biblioteca de drag-and-drop (nenhuma está instalada no projeto hoje) seria desproporcional ao problema. Botões de mover são suficientes e não adicionam dependência nova.

### Decisão 5: carrossel de banners é scroll horizontal com CSS, não um slider em JavaScript

A vitrine exibe os banners (ordenados por `position`) num contêiner com `scroll-snap` horizontal (rolagem por gesto/arraste, sem setas nem autoplay). Cada banner é um link (`<a>`/`<Link>`) para `/loja?categoria=<categoryId>` do banner correspondente.

**Por quê:** Mesmo raciocínio da Decisão 4 — no máximo 3 imagens não justifica uma biblioteca de carrossel (nenhuma está instalada); scroll-snap nativo do CSS resolve sem JavaScript de estado nem nova dependência. Non-Goal explícito: sem autoplay/rotação automática.

### Decisão 6: busca e filtro de categoria são inteiramente client-side

Nenhum parâmetro novo é adicionado a `GET /storefront/products`. O frontend busca a lista completa (já acontece hoje) e a lista de `/categories` (para os nomes do filtro), e filtra localmente por substring do `name` (case-insensitive) e por `categoryId` selecionado — os dois filtros combinam com E lógico.

**Por quê:** Mesma premissa da change-007 (volume pequeno, sem paginação). Adicionar busca/filtro no backend agora seria complexidade adiantada sem necessidade real — se o catálogo crescer a ponto de precisar, é um ajuste isolado no endpoint existente, não uma mudança de contrato para o frontend.

### Decisão 7: leitura pública de banners no `StorefrontController` já existente, não no `BannerController`

O CRUD administrativo (`BannerController`, `/banners`) continua autenticado. A vitrine pública (visitante sem login) lê os banners através de um endpoint novo `GET /storefront/banners` (`@Public()`), adicionado ao `StorefrontController` que já existe desde a change-007 (hoje só expõe `GET /storefront/products`) — não pelo `BannerController`.

**Por quê:** O `StorefrontController` já é o lugar estabelecido para "leituras públicas com filtro de visibilidade" (conforme o próprio *Impact* da change-007). Adicionar `@Public()` diretamente no `BannerController` misturaria CRUD administrativo autenticado com leitura pública no mesmo controller — o padrão já usado pelo projeto separa as duas coisas em controllers distintos (`ProductController` autenticado vs. `StorefrontController` público, ambos reaproveitando o mesmo repositório por baixo).

**Revisão pós-implementação:** o backend foi reorganizado para agrupar cada módulo Nest (`auth`, `catalog`, `settings`) por agregado de domínio, uma subpasta por agregado (ex.: `catalog/product`, `catalog/stock`, `settings/store-settings`). Nessa reorganização, `BannerController`/`PrismaBannerRepository` moveram de `catalog/banner` para `settings/banner` — o admin agrupa "Banners" na seção "Configurações" da sidebar (não em "Catálogo"), então o backend passou a espelhar essa mesma divisão de responsabilidade. `SettingsModule` agora exporta `PrismaBannerRepository`, e `CatalogModule` importa `SettingsModule` para que `StorefrontController` (que continua em `catalog/storefront`, pois compõe leituras públicas de produtos, banners e pedidos) consiga injetá-lo. A entidade `Banner` em si permanece no pacote de domínio `@sdd/catalog` (ela referencia `Category`, que é do catálogo) — só a camada de infraestrutura Nest (controller/repositório Prisma) mudou de módulo.

### Decisão 8: banner referencia categoria ou link; clique navega ou abre em nova aba conforme o destino

Clicar num banner com `categoryId` preenchido navega para `/loja?categoria=<categoryId>`, e a vitrine lê esse query param no carregamento para pré-selecionar o filtro de categoria (o mesmo estado usado pelo dropdown de filtro da Decisão 6). Clicar num banner com `linkUrl` preenchida abre essa URL numa nova aba (`window.open(linkUrl, '_blank', 'noopener,noreferrer')`), sem navegar a vitrine para fora dela.

**Por quê:** Um único mecanismo de filtro (estado + query param) serve tanto o clique no banner quanto a seleção manual no dropdown — evita ter dois caminhos de código para a mesma coisa. Para `linkUrl` (Decisão 2), abrir em nova aba evita que o visitante perca a vitrine ao clicar num link externo (ex.: WhatsApp, rede social, página de terceiros) — mesmo raciocínio de qualquer link externo em uma página de e-commerce.

**Detalhe descoberto na implementação:** ler o query param exige `useSearchParams()` (Next.js), que só funciona corretamente em produção se o componente que o usa estiver dentro de um `<Suspense>` boundary — sem isso, `next build` falha ao pré-renderizar `/loja` (`useSearchParams() should be wrapped in a suspense boundary`), um erro que não aparece nem no `next dev` nem no `tsc --noEmit`, só no build de produção. `ProductGrid` foi dividido num wrapper (`<Suspense>`) e um componente interno que de fato usa `useSearchParams`.

## Risks / Trade-offs

- **Upload de logo/banner ainda é pasta local** (mesmo trade-off já aceito na change-006/007) → Mitigação: aceito para o estágio atual do projeto; migração para storage em nuvem é uma change futura isolada.
- **Scroll-snap sem setas pode não ser óbvio para todo usuário em desktop (sem mouse de toque)** → Mitigação: aceito nesta entrega; adicionar setas de navegação é um ajuste incremental futuro se o feedback do usuário indicar necessidade.
- **Filtro/busca client-side não escala indefinidamente** → Mitigação: aceito, mesma decisão já tomada e documentada na change-007 para o volume esperado.
- **Regra de "máximo 3 banners" verificada via `findPage` faz uma query extra na criação** → Mitigação: irrelevante em volume (no máximo 3 banners existem por definição), custo desprezível.

## Migration Plan

Não há sistema em produção. Entrega incremental:

1. **Domínio**: estender `store-settings` com `logoUrl`; criar agregado `banner` (entidade, repositório, `save-banner` com regra de máximo 3, `delete-banner`, testes).
2. **Backend `settings`**: migration incremental (`logoUrl` nullable), endpoints `POST/DELETE /settings/logo`, `GET /settings` passa a incluir `logoUrl`.
3. **Backend `banner`**: model Prisma + migration (FK `categoryId` para `Category`), repositório Prisma, `BannerController` (CRUD completo autenticado), `banner.integration.http`.
4. **Frontend `settings`**: upload/preview/remoção de logo na tela de Configurações.
5. **Frontend `banner`**: tela admin "Banners" (listar com subir/descer, criar, editar, excluir), item de menu.
6. **Frontend `storefront`**: logo no header, carrossel de banners (scroll-snap) linkando para `/loja?categoria=...`, campo de busca, dropdown de filtro de categoria com nomes, leitura do query param `categoria` para pré-selecionar o filtro.
7. Rodar `npx tsc --noEmit` no frontend e sinalizar ao usuário para conferência manual.

Rollback: descartar a branch.

## Open Questions

Nenhuma. As decisões desta change cobrem destino do banner (categoria), reordenação (botões, não drag-and-drop), carrossel (scroll-snap, não biblioteca) e escopo do filtro/busca (client-side), conforme decidido com o usuário durante a exploração.
