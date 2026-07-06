## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Context

O checkout da vitrine (change-007) hoje é 100% client-side: monta uma mensagem de texto e abre `wa.me`, sem qualquer chamada ao backend. Esta change introduz o primeiro ponto de contato real entre "o cliente finalizou o pedido" e o backend — e, com ele, a primeira transação com múltiplas operações condicionais do projeto (descontar estoque de vários itens e, só se todos derem certo, criar o pedido).

Premissas herdadas:

- `Stock.quantity` existe desde a change-006, hoje só editado manualmente (admin) ou pela criação/atualização do produto (change-007).
- `StockRepository` (contrato de domínio) tem os métodos padrão de `CrudRepository` mais `findByProductId` — nenhum método de decremento atômico existe ainda.
- `StorefrontController` (change-007) já é o lugar estabelecido para "leituras públicas com filtro de visibilidade" no módulo `catalog` — reaproveitado também pela change-008 para banners.
- Não existe conceito de conta/login de cliente na vitrine — é inteiramente anônima.
- O WhatsApp é só um link (`wa.me`) que abre o aplicativo; não há confirmação de que a mensagem foi de fato enviada.

## Goals / Non-Goals

**Goals:**

- Descontar estoque de forma atômica e resistente a concorrência no momento do checkout.
- Persistir o pedido com um retrato fiel do que foi comprado (nome e preço no momento da compra, não uma referência viva ao produto).
- Dar visibilidade do pedido tanto para o lojista (admin) quanto para o cliente (consulta pública por código).

**Non-Goals:**

- Pagamento ou qualquer integração de cobrança — o "pedido" é só um registro do que foi solicitado; a transação financeira continua acontecendo fora do sistema (combinada por WhatsApp).
- Status de pedido (pendente, confirmado, cancelado, entregue) — o pedido nasce e existe como um registro único e imutável. Se o negócio precisar de status depois, é uma extensão futura do agregado.
- Edição ou cancelamento de pedido pelo admin — somente leitura.
- Reversão automática de estoque se um pedido for "cancelado" (não existe cancelamento nesta change).
- Notificação ao cliente além do link que ele mesmo recebe na mensagem de WhatsApp (sem e-mail, sem SMS).
- Resolver o risco de abandono (cliente fecha a aba antes de mandar a mensagem de WhatsApp de verdade, com o estoque já descontado) — é uma limitação inerente ao checkout via WhatsApp sem confirmação de pagamento, não algo que esta change resolve.

## Decisions

### Decisão 1: desconto de estoque via atualização condicional atômica, não leitura-depois-escrita

`StockRepository` ganha o método `decrementIfAvailable(productId: string, quantity: number): Promise<boolean>`. A implementação Prisma faz uma única operação `updateMany` com `where: { productId, quantity: { gte: quantity } }` e `data: { quantity: { decrement: quantity } }`, retornando `true` se `count > 0` (encontrou e atualizou uma linha) ou `false` caso contrário (não havia estoque suficiente). NÃO PODE ser implementado como "ler a quantidade, comparar em código, depois escrever" — isso teria uma janela de corrida entre dois checkouts simultâneos para o mesmo produto.

**Por quê:** Dois clientes finalizando pedido para a última unidade ao mesmo tempo não podem os dois "ganhar" — a condição `quantity >= X` dentro do próprio `UPDATE` garante que o banco resolve a corrida de forma atômica, sem precisar de lock explícito nem de nova infraestrutura.

### Decisão 2: `order` é um agregado novo no módulo `catalog`, com um único caso de uso de criação

`Order { id, code, customerName, items, total, createdAt }`. Ao contrário de todo agregado anterior do projeto (que sempre tem `save-X` cobrindo criar e atualizar), `order` SHALL ter apenas `create-order` — não existe atualização nem exclusão manual. Um pedido nasce como resultado de um checkout bem-sucedido e não muda depois (ver Non-Goals: sem status, sem edição, sem cancelamento).

**Por quê:** Um pedido é o registro de um evento que já aconteceu — deixar editável abriria a porta para reescrever histórico. Isso é uma quebra deliberada do padrão `save-X`/`delete-X` usado por todo agregado anterior, e vale registrar como decisão consciente, não descuido.

### Decisão 3: itens do pedido guardam nome e preço **congelados**, como `Json`, não uma relação com `Product`

`Order.items` é uma lista de `{ productId, name, price, quantity }`, armazenada como coluna `Json` no Prisma (mesmo raciocínio já usado para `Product.images`: lista pequena e delimitada, sem necessidade de tabela filha). `name` e `price` são copiados do produto **no momento do checkout** — não são recalculados nem sincronizados depois. `productId` é mantido só como referência informativa (não é uma foreign key rígida — o produto associado pode ser excluído no futuro sem quebrar o pedido).

**Por quê:** Se o preço ou nome do produto mudar depois (ou o produto for excluído), o pedido precisa continuar mostrando exatamente o que foi comprado naquele momento — esse é o comportamento esperado de qualquer histórico de compra. Guardar como `Json` evita uma tabela `order_item` só para isso, consistente com a decisão já tomada para `Product.images`.

### Decisão 4: checkout é uma transação única — desconta tudo ou nada, depois cria o pedido

`POST /storefront/checkout` executa dentro de uma transação interativa do Prisma (`$transaction(async (tx) => ...)`): para cada item do carrinho, chama `decrementIfAvailable`; se **qualquer** item falhar (estoque insuficiente), a transação inteira é abortada (nenhum item é descontado, nenhum pedido é criado) e o endpoint retorna `422` com a lista dos itens que ficaram sem estoque suficiente. Se todos os itens tiverem estoque suficiente, o pedido é criado (com `items` já com nome/preço snapshotados) na mesma transação, e o endpoint retorna `{ code }`.

**Por quê:** Comprar 3 de 5 itens do carrinho e falhar nos outros 2 deixaria o carrinho num estado ambíguo (parte comprada, parte não) sem nenhum pedido pra mostrar o que realmente aconteceu. Tudo-ou-nada é mais simples de raciocinar tanto pro backend quanto pra experiência do cliente (ele vê exatamente quais itens têm menos estoque do que o carrinho pede, ajusta, tenta de novo).

### Decisão 5: `code` é um identificador curto e público, distinto do `id` interno

Além do `id` (uuid interno, padrão do projeto), `Order` tem um campo `code` (string curta, ex.: 8 caracteres alfanuméricos maiúsculos, gerado no backend na criação, único). É o `code` — não o `id` — que aparece na mensagem de WhatsApp e na URL pública de consulta (`/pedido/<code>`), e é o `code` que o endpoint público (`GET /storefront/orders/:code`) usa para buscar.

**Por quê:** Um uuid (`3f2c44a9-03ae-48ec-9ff3-283f4e1be32b`) é hostil numa mensagem de WhatsApp ou como algo que o cliente digita/copia. Um código curto é mais fácil de compartilhar e de digitar. Colisão é checada na criação (busca por `code` antes de persistir); em caso raro de colisão, gera outro e tenta de novo (poucas tentativas, espaço de códigos grande o suficiente para o volume esperado).

### Decisão 6: leitura pública do pedido é por `code`, sem autenticação — mesmo modelo de "link com o segredo embutido"

`GET /storefront/orders/:code` é público (`@Public()`), no `StorefrontController`. Não existe conta de cliente, então "ver o próprio pedido" só é possível de quem tem o `code` — o mesmo modelo já usado por serviços de rastreio de encomenda sem login.

**Por quê:** Decisão do usuário durante a exploração: o cliente acessa o pedido depois pelo código que vai na própria mensagem de WhatsApp. Isso evita construir qualquer sistema de conta/sessão de cliente só para esta feature.

### Decisão 7: `OrderController` (admin) é autenticado e somente leitura

O admin vê pedidos via `GET /orders` (paginado) e `GET /orders/:id`, ambos autenticados, sem `POST`/`PUT`/`DELETE` — o pedido só nasce pelo checkout público (`StorefrontController`), nunca por criação manual no admin.

**Por quê:** Consistente com a Decisão 2 (pedido é histórico imutável) — não faz sentido o admin "criar" um pedido manualmente ou editá-lo depois de criado.

### Decisão 8: mensagem de WhatsApp passa a incluir o código do pedido e o link de consulta

Após um checkout bem-sucedido, a mensagem gerada para o WhatsApp inclui uma linha adicional com o código do pedido e a URL completa de consulta (`<origem do frontend>/pedido/<code>`, montada com `window.location.origin` em tempo de execução — sem variável de ambiente nova).

**Por quê:** É o único canal que o cliente tem para redescobrir o pedido depois (Decisão 6) — se o código não estiver na mensagem, o cliente não tem como saber que ele existe.

## Risks / Trade-offs

- **Cliente pode abandonar o checkout depois do estoque já ter sido descontado** (fecha a aba antes do WhatsApp abrir, ou nunca envia a mensagem) → Aceito como limitação inerente ao modelo de checkout via WhatsApp sem confirmação de pagamento (ver Non-Goals); não há como o backend distinguir "enviou de verdade" de "desistiu no último passo".
- **Sem status de pedido**, o lojista não tem como marcar um pedido como "atendido"/"cancelado" no sistema → Aceito nesta entrega; é uma extensão natural e isolada do agregado `order` se vier a ser necessário.
- **Colisão de código curto** (baixa probabilidade, mas existe) → Mitigado por checar unicidade antes de persistir e gerar outro em caso de colisão.
- **`items` como `Json` perde a capacidade de fazer consultas relacionais** (ex.: "quantos pedidos incluíram o produto X") **diretamente no banco** → Aceito para o volume esperado; se necessário no futuro, é uma migração isolada para uma tabela `order_item` própria, sem afetar o resto do agregado.

## Migration Plan

Não há sistema em produção. Entrega incremental:

1. **Domínio `stock` (extensão)**: adicionar `decrementIfAvailable` ao contrato `StockRepository` (sem alterar os métodos existentes).
2. **Domínio `order`**: agregado novo (entidade com itens congelados, contrato de repositório, `create-order`, geração/checagem de `code`), testes com fakes.
3. **Backend `stock` (extensão)**: implementar `decrementIfAvailable` no Prisma como `updateMany` condicional atômico.
4. **Backend `order`**: model Prisma (`items` como `Json`), migration, repositório Prisma, `POST /storefront/checkout` e `GET /storefront/orders/:code` no `StorefrontController`, `OrderController` (admin, somente leitura), cobertura HTTP.
5. **Frontend admin**: tela "Pedidos" (listagem + detalhe), item de menu.
6. **Frontend storefront**: checkout passa a chamar `POST /storefront/checkout` antes do WhatsApp; mensagem inclui código + link; nova rota pública `/pedido/[codigo]`.
7. Rodar `npx tsc --noEmit` no frontend e sinalizar ao usuário para conferência manual.

Rollback: descartar a branch.

## Open Questions

Nenhuma. As decisões desta change cobrem a atomicidade do desconto, a estrutura do pedido (itens congelados), o mecanismo de acesso do cliente (código público) e o escopo do admin (somente leitura), conforme decidido com o usuário durante a exploração.
