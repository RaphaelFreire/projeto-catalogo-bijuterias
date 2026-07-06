## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Context

Até aqui, todo o projeto é uma ferramenta administrativa: tudo atrás de `JwtAuthGuard` global, exceto `/auth/register` e `/auth/login` (marcados com `@Public()`). Esta change introduz a primeira superfície pública de verdade (vitrine de produtos + configuração consultável sem login) e o primeiro conceito de configuração singleton do projeto. Ambos os padrões (leitura pública filtrada, configuração de registro único) não têm precedente e ficam fixados aqui para reuso futuro.

Premissas herdadas:

- Módulo `catalog` já tem os agregados `product`, `category` e `stock` (change-006), incluindo `Product.status`, `Product.images`, `Product.categoryId` e o agregado `Stock` (quantidade por produto).
- `ProductController`/`CategoryController`/`StockController` já seguem o padrão: comandos instanciam caso de uso no corpo do método; consultas chamam o repositório direto; controllers injetam a classe Prisma concreta (não a interface do domínio).
- Pacote compartilhado tem `PhoneRule` (formato E.164, `^\+[1-9]\d{1,14}$`) e `PhoneBrRule` (formato brasileiro com/sem DDI, sem símbolo `+`).
- Frontend tem grupo `(private)` (admin, com sidebar via `APP_MODULES`) e `(public)` (hoje só `/join`, com `PublicBoxedLayout` — layout em caixa centralizada pensado para formulário de autenticação).
- Rota raiz `/` é uma landing page genérica de SaaS (scaffold do projeto), sem relação com esta feature.
- Projeto está pré-produção (nenhum dado real em uso).

## Goals / Non-Goals

**Goals:**

- Expor uma vitrine pública com os produtos ativos do catálogo, sem exigir login.
- Permitir montar um carrinho e transformá-lo numa mensagem de WhatsApp pronta para envio, com o número da loja configurável pelo admin.
- Fixar o padrão de "configuração singleton" (um registro só, sem CRUD de coleção) para reuso por futuras configurações da loja.
- Fixar o padrão de "leitura pública filtrada" que reaproveita repositórios já existentes, sem alterar contratos de domínio.

**Non-Goals:**

- Pedido persistido no backend, pagamento, endereço de entrega, histórico de pedidos, conta/login do cliente final — nada disso é criado nesta change. O carrinho existe só no navegador do visitante.
- Filtro por categoria na vitrine (fica para uma change futura).
- Uso do campo `availableOnline` como filtro adicional de visibilidade — a vitrine mostra todo produto com `status: active`, independente de `availableOnline` (esse campo continua sem uso definido).
- Reserva de estoque ou decremento automático de quantidade ao adicionar ao carrinho — o carrinho não interage com o backend além da leitura inicial da vitrine.
- Múltiplas configurações de loja (multi-tenant) — `store-settings` é um registro único para toda a instalação.
- Verificação automatizada de UI (mesma decisão já registrada nas changes anteriores).

## Decisions

### Decisão 1: `store-settings` é um agregado singleton, endereçado por um id fixo conhecido do backend

`StoreSettings { id, whatsappNumber }`. O `id` nunca é escolhido pelo cliente nem exposto como parâmetro de rota — é uma constante fixa definida no módulo (`STORE_SETTINGS_ID`), usada internamente pelo controller em toda chamada.

**Por quê:** Reaproveita 100% o mecanismo `save-*` já usado por `product`/`category`/`stock` (decide criar ou atualizar via `findById`), sem inventar um mecanismo novo. A única diferença é que o `id` não vem do cliente — vem de uma constante do backend. Isso evita modelar "configuração" como uma tabela chave-valor genérica (over-engineering para um único campo hoje) e mantém o singleton simples de entender: sempre existe zero ou um registro, e o backend sempre pergunta pelo mesmo id.

**Como o caso de uso funciona:** `SaveStoreSettings.execute({ whatsappNumber })` — o `id` é injetado pelo controller (não pelo body da requisição) como `STORE_SETTINGS_ID`. Se `findById(STORE_SETTINGS_ID)` encontrar um registro, atualiza; senão, cria com esse id fixo. Na prática, após o primeiro `PUT /settings`, sempre existe exatamente um registro.

### Decisão 2: `SettingsRepository` mantém o formato `CrudRepository`, mas só dois métodos são expostos via HTTP

O contrato de domínio `SettingsRepository extends CrudRepository<StoreSettings, StoreSettings, StoreSettings, SettingsPageParams>` (mesmo formato dos outros agregados, por consistência estrutural), mas `SettingsController` expõe **apenas** `GET /settings` (retorna o registro único, ou um valor default como `{ whatsappNumber: null }` se ainda não configurado) e `PUT /settings` (cria ou atualiza via `save-store-settings`). Sem `POST` avulso, sem `DELETE`, sem listagem paginada.

**Por quê:** Não existe cenário de "criar um segundo registro de configuração" nem "excluir a configuração da loja" — a tela admin só visualiza/edita. Manter o contrato de domínio no formato padrão evita criar um tipo de repositório especial só para este agregado; a restrição fica na camada HTTP, mesmo padrão de raciocínio já usado para outras restrições de superfície neste projeto.

### Decisão 3: `GET /settings` é público; `PUT /settings` é autenticado

**Por quê:** O número de WhatsApp da loja não é informação sensível — ele existe justamente para que clientes finais o usem. A vitrine pública precisa lê-lo sem exigir login. A edição, por outro lado, é uma ação administrativa e continua atrás do `JwtAuthGuard` (sem `@Public()`).

### Decisão 4: leitura pública de produtos é um controller novo no módulo `catalog`, sem novo agregado

`GET /storefront/products` (marcado com `@Public()`) filtra produtos com `status: 'active'` e, para cada um, resolve a quantidade de estoque via `StockRepository.findByProductId(...)` (método que já existe no contrato de domínio de `stock`, criado na change-006). O controller injeta `PrismaProductRepository` e `PrismaStockRepository` (classes concretas, mesmo padrão de `StockController`) e monta a resposta pública manualmente — nenhum contrato de domínio muda.

**Por quê:** Não há necessidade de um agregado novo — é uma composição de leitura sobre dados que já existem. Um controller dedicado (em vez de acrescentar um método `@Public()` no `ProductController` administrativo) deixa explícito, pela própria rota (`/storefront/products` vs. `/products`), que a superfície pública é distinta da administrativa e filtra por status — reduz o risco de alguém remover o filtro por engano ao mexer no `ProductController` no futuro.

**Trade-off:** duas rotas HTTP para "produtos" (`/products` administrativo, `/storefront/products` público) — aceito, é a forma mais clara de manter as duas superfícies (e suas regras de visibilidade) independentes.

### Decisão 5: produto sem estoque aparece desabilitado, não escondido

O endpoint público retorna todo produto `active`, incluindo os com `quantity: 0` — o frontend decide exibir "Esgotado" e desabilitar o botão de adicionar ao carrinho. O backend não filtra por quantidade.

**Por quê:** Decisão explícita do usuário — manter o produto visível preserva valor de vitrine (o visitante sabe que o produto existe e pode voltar depois).

### Decisão 6: carrinho e identificação do cliente vivem só no frontend, sem chamada ao backend

O carrinho é estado do React (Context) persistido em `localStorage` (chave dedicada, ex. `storefront.cart`). O nome do cliente é capturado num campo de formulário na etapa final, também sem enviar nada ao backend. Nenhuma dessas informações é lida por nenhuma rota HTTP nova.

**Por quê:** Não existe conceito de "pedido" no backend (non-goal explícito) — o carrinho e a identificação do cliente existem só para montar o texto da mensagem de WhatsApp no próprio navegador.

### Decisão 7: número de telefone armazenado em E.164 (`PhoneRule`), convertido para o formato do `wa.me` na hora de montar o link

`StoreSettings.whatsappNumber` é validado com `PhoneRule` (formato `+5511999998888`). O link do WhatsApp (`https://wa.me/<numero>`) exige o número **sem** o `+` — a conversão (`whatsappNumber.replace('+', '')`) acontece no frontend, na hora de montar o link, não na hora de persistir.

**Por quê:** `PhoneRule` (E.164) foi preferido a `PhoneBrRule` (formato brasileiro) porque guarda uma representação canônica e internacionalmente inequívoca (com DDI explícito), sem assumir implicitamente que a loja é sempre brasileira — mesmo o produto sendo hoje em pt-BR. Guardar em E.164 e converter só na hora de montar o link é mais simples do que guardar em formato local e ter que inferir o DDI depois.

### Decisão 8: template da mensagem de WhatsApp

```
Pedido de {nome do cliente}:

1x Camiseta Branca — R$ 99,90
2x Caneca Preta — R$ 59,00

Total: R$ 158,90
```

Implementação: cada linha do carrinho vira `"{quantidade}x {nome} — {preço unitário formatado}"`, seguido de uma linha em branco e do total geral. A string inteira é codificada com `encodeURIComponent` antes de entrar na query string `?text=`.

**Por quê:** Formato objetivo, fácil de ler dentro do WhatsApp, com todas as informações que o usuário pediu (nome do cliente, produto, quantidade, preço, total).

### Decisão 9: rota pública nova (`/loja`) fora do `PublicBoxedLayout`

A vitrine vive fora do grupo `(private)` e não usa `PublicBoxedLayout` (layout em caixa centralizada, pensado para formulário de login/cadastro). Usa um layout próprio, de largura total, com grade responsiva.

**Por quê:** `PublicBoxedLayout` foi desenhado para uma tela de formulário estreito — uma vitrine com grade de produtos e carrinho precisa de largura total e uma estrutura visual completamente diferente. Forçar o layout existente exigiria descaracterizá-lo ou criar um caso especial dentro dele; mais simples ter um layout dedicado.

### Decisão 10: capabilities separadas por módulo/camada

Cinco capabilities novas: `settings-domain`, `settings-backend`, `settings-frontend`, `catalog-storefront-backend` (sem capability de domínio própria — não há agregado novo), `storefront-frontend`.

**Por quê:** Mesma granularidade das changes anteriores. `catalog-storefront-backend` não tem uma capability de domínio irmã porque não introduz nenhum agregado ou caso de uso novo — é só uma composição de leitura no controller.

## Risks / Trade-offs

- **Carrinho só em `localStorage`** → perdido se o visitante limpar dados do navegador ou trocar de dispositivo. Aceito — não há conta de cliente nesta change.
- **Sem reserva de estoque**: dois visitantes podem "comprar" o mesmo último item simultaneamente (o carrinho não decrementa estoque real). Aceito — a confirmação real do pedido acontece na conversa de WhatsApp, fora do sistema.
- **Mensagem de texto pode ficar longa** com carrinhos grandes — aceito para o volume esperado (compra via WhatsApp tende a ser pequena/pontual).
- **`GET /settings` público expõe o número de WhatsApp sem autenticação** → aceito, é informação que a loja quer divulgar; se no futuro `store-settings` ganhar campos sensíveis, a rota pública precisará ser revisada para retornar só um subconjunto seguro.
- **Duas rotas de produto (`/products` e `/storefront/products`)** → aceito (ver Decisão 4); risco mitigado por nomes de rota explícitos.
- **Sem testes automatizados de UI** → mesma decisão das changes anteriores.

## Migration Plan

Não há sistema em produção. Entrega incremental:

1. **Domínio `settings`**: agregado `store-settings`, entidade validada (`whatsappNumber` com `PhoneRule`), contrato de repositório, caso de uso `save-store-settings` (com id fixo), testes unitários com fakes.
2. **Backend `settings`**: sincronizar Prisma + migration, repositório Prisma, `SettingsController` (`GET`/`PUT`, com `GET` público), `settings.integration.http`.
3. **Backend `catalog` (storefront)**: `StorefrontController` novo, expondo `GET /storefront/products` (`@Public()`), reaproveitando `PrismaProductRepository` e `PrismaStockRepository`.
4. **Frontend `settings`**: tela única de configurações (visualizar/editar o WhatsApp), item "Configurações" no menu lateral, i18n.
5. **Frontend `storefront`**: layout próprio, rota `/loja`, grade responsiva de produtos, carrinho (Context + `localStorage`), etapa de identificação do cliente, geração do link de WhatsApp.
6. Rodar `npx tsc --noEmit` no frontend e sinalizar ao usuário para conferência manual.

Rollback: descartar a branch.

## Open Questions

- Nenhuma. As decisões desta change cobrem o modelo do singleton de configuração, a composição da leitura pública de produto+estoque e o formato exato da mensagem de WhatsApp, conforme solicitado.
