## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Why

O catálogo hoje só existe para uso administrativo (autenticado). Não há nenhuma forma do público final ver os produtos e comprar. Esta change entrega uma vitrine pública onde qualquer visitante (sem login) monta um carrinho e, ao finalizar, o pedido vira uma mensagem de WhatsApp para o número da loja — sem checkout, pagamento ou pedido persistido no backend. É a primeira feature do projeto voltada ao cliente final, e o primeiro uso real dos campos `status`, `images` e `stock` do produto (construídos nas changes anteriores) e da relação com `category`.

## What Changes

- Criar o módulo `settings` com o agregado singleton `store-settings`: um único registro de configuração da loja, contendo `whatsappNumber` (validado com `PhoneRule` do pacote compartilhado, formato E.164).
- Implementar o caso de uso `save-store-settings` (cria ou atualiza o único registro, sempre operando sobre um id fixo conhecido pelo backend — nunca informado pelo cliente).
- Sincronizar `settings` com o Prisma (model + migration) e implementar o repositório Prisma correspondente.
- Expor `GET /settings` (público, sem autenticação — o número de WhatsApp não é informação sensível) e `PUT /settings` (autenticado, sem `POST`/`DELETE`/listagem, já que é um registro único).
- Criar no admin (`(private)`) uma tela nova de "Configurações" — visualizar/editar o número de WhatsApp da loja, sem lista, sem criar, sem excluir (primeira tela do projeto fora do padrão de listagem/CRUD). Item novo no menu lateral.
- Criar no backend do módulo `catalog` um endpoint público novo (`GET /storefront/products`, `@Public()`) que lista produtos com `status: 'active'`, incluindo a quantidade em estoque de cada um (resolvida no controller via `ProductRepository` + `StockRepository`, sem alterar o contrato de domínio de nenhum dos dois agregados). Não expõe produtos com outros status nem o CRUD administrativo.
- Criar rota pública nova no frontend (`/loja`), fora do grupo `(private)` e do layout `PublicBoxedLayout` de autenticação, com layout próprio: grade responsiva de produtos (1–2 colunas no mobile, 2–3 no tablet, 3–4 no desktop). Cada card mostra imagem de capa (primeira imagem da galeria, se houver), nome, descrição truncada em 2 linhas, preço e botão "Adicionar ao carrinho". Produto com estoque zero aparece com badge "Esgotado" e botão desabilitado.
- Implementar carrinho no cliente (React Context + `localStorage`), sobrevivendo a reload da página, sem qualquer persistência no backend.
- Implementar tela/etapa de fechamento de pedido: captura o nome do cliente, monta a mensagem de texto (nome, itens com quantidade e preço, total geral) e abre `https://wa.me/<numeroDaLoja>?text=<mensagem codificada>`, buscando o número via `GET /settings`.
- Rodar `npx tsc --noEmit` em `apps/frontend` ao final e sinalizar ao usuário que a UI está pronta para conferência manual. **Sem verificação automatizada de UI nesta change.**

## Capabilities

### New Capabilities

- `settings-domain`: Agregado singleton `store-settings` no módulo `settings`, com entidade validada, contrato de repositório e caso de uso `save-store-settings` operando sobre um id fixo. Cobertura unitária com fakes.
- `settings-backend`: Model Prisma de `store-settings`, repositório Prisma, `SettingsController` expondo `GET /settings` (público) e `PUT /settings` (autenticado) — sem `POST`, `DELETE` nem listagem. Cobertura HTTP em `settings.integration.http`.
- `settings-frontend`: Tela administrativa única de "Configurações" (visualizar/editar o número de WhatsApp, sem lista/criar/excluir), item "Configurações" no menu lateral, i18n complementar.
- `catalog-storefront-backend`: Endpoint público `GET /storefront/products` no módulo `catalog`, listando produtos ativos com quantidade de estoque, reaproveitando os repositórios já existentes de `product` e `stock` sem alterar seus contratos de domínio.
- `storefront-frontend`: Vitrine pública (`/loja`) com grade responsiva de produtos, carrinho em `localStorage`, captura do nome do cliente e geração do link de WhatsApp com o resumo do pedido.

### Modified Capabilities

- `catalog-product-domain`: os flags booleanos `availableOnline`/`featured`/`allowsPreOrder` (change-005/006) foram renomeados para `bestSeller`/`dailyDeal`/`lastUnits` — mesmo comportamento estrutural (booleanos independentes, default `false`), ressignificados de "disponibilidade" para "selos de marketing" exibidos na vitrine.
- `catalog-product-backend`: `POST /products` passa a aceitar `id` e `quantity` opcionais no corpo (usando `quantity` como estoque inicial em vez de sempre `0`) e a retornar `{ id }`; `PUT /products/:id` passa a aceitar `quantity` opcional, atualizando o estoque associado; leituras (`GET /products/:id` e listagem) passam a incluir `quantity`, resolvida a partir do estoque associado. Model Prisma e mapeamentos de leitura acompanham a renomeação dos flags.
- `catalog-product-frontend`: formulário de produto ganha o campo "Quantidade em estoque" (seção "Preço e status"); a seção "Disponibilidade" foi renomeada para "Marketing" com os checkboxes renomeados; a seção "Imagens" passa a ficar disponível também em modo criação (arquivos ficam em estado local até a submissão, enviados após a criação do produto).

## Impact

- Adiciona o módulo `settings` (agregado, entidade, repositório, caso de uso, testes) e o model Prisma/migration correspondente.
- Adiciona a `apps/backend/src/modules/settings/{settings.controller.ts,settings.prisma.ts,settings.module.ts,settings.integration.http}` e registra o módulo em `app.module.ts`.
- Adiciona a `apps/backend/src/modules/catalog` um controller novo (`storefront.controller.ts`) expondo a leitura pública de produtos + estoque.
- Adiciona ao frontend a tela de configurações (admin), o item de menu correspondente, e a vitrine pública nova (`/loja`) com carrinho, i18n complementar e o fluxo de geração da mensagem de WhatsApp.
- Primeira feature do projeto acessível sem autenticação além do login/cadastro — introduz o padrão de "leitura pública com filtro de visibilidade" (reaproveitável por futuras vitrines) e o padrão de "configuração singleton" (reaproveitável por futuras configurações da loja).
