# storefront-frontend Specification

## Purpose
TBD - created by change-007-vitrine-publica-whatsapp. Extended by change-008-vitrine-marca-banners-busca (logo no header, carrossel de banners, busca e filtro por categoria) e change-009-pedido-desconto-estoque (checkout chama o backend, consulta pública de pedido por código). Update Purpose after archive.

## Requirements

### Requirement: Rota pública `/loja` com layout próprio

O frontend SHALL incluir uma rota pública nova (`/loja`), fora do grupo `(private)` e fora do `PublicBoxedLayout` (layout de autenticação em caixa centralizada). Esta rota usa um layout próprio, de largura total.

#### Scenario: Rota acessível sem autenticação

- **WHEN** um visitante sem sessão acessa `/loja`
- **THEN** a vitrine é renderizada normalmente, sem redirecionamento para login

### Requirement: Logo da loja no header, com fallback

O header da vitrine SHALL exibir a logo da loja (obtida via `GET /settings`, campo `logoUrl`) quando configurada. Quando `logoUrl` for `null`, o header SHALL exibir o ícone/título genérico atual como fallback.

#### Scenario: Logo configurada

- **WHEN** `GET /settings` retorna `logoUrl` preenchida
- **THEN** o header da vitrine exibe a logo no lugar do ícone/título genérico

#### Scenario: Sem logo configurada

- **WHEN** `GET /settings` retorna `logoUrl: null`
- **THEN** o header exibe o ícone/título genérico (fallback atual)

### Requirement: Carrossel de banners no topo da vitrine

Quando existir ao menos um banner cadastrado (`GET /storefront/banners`, público), a vitrine SHALL exibir um carrossel no topo da página, acima da grade de produtos, com os banners ordenados por `position`, num contêiner de rolagem horizontal com `scroll-snap` (sem setas de navegação, sem rotação automática). O destino do clique depende do banner: se `categoryId` estiver preenchido, navega para `/loja?categoria=<categoryId>`; se `linkUrl` estiver preenchida, abre essa URL em uma nova aba. Sem banners cadastrados, o carrossel NÃO PODE ser renderizado.

#### Scenario: Carrossel exibido com banners cadastrados

- **WHEN** existem banners cadastrados
- **THEN** o carrossel é exibido no topo da vitrine, com os banners na ordem de `position`

#### Scenario: Sem carrossel quando não há banners

- **WHEN** não existe nenhum banner cadastrado
- **THEN** o carrossel não é renderizado

#### Scenario: Clique no banner filtra por categoria

- **WHEN** o usuário clica num banner com `categoryId` preenchido
- **THEN** o navegador vai para `/loja?categoria=<categoryId>` do banner
- **AND** a vitrine carrega com o filtro de categoria pré-selecionado (ver requirement de filtro abaixo)

#### Scenario: Clique no banner abre um link externo

- **WHEN** o usuário clica num banner com `linkUrl` preenchida
- **THEN** o navegador abre essa URL em uma nova aba, sem navegar para fora da vitrine na aba atual

### Requirement: Grade responsiva de produtos

A vitrine SHALL exibir os produtos retornados por `GET /storefront/products` em uma grade responsiva: 1–2 colunas em telas mobile, 2–3 em tablet, 3–4 em desktop.

#### Scenario: Grade reflow por tamanho de tela

- **WHEN** a vitrine é renderizada em diferentes larguras de viewport
- **THEN** o número de colunas se ajusta conforme o breakpoint (mobile/tablet/desktop)

### Requirement: Busca por nome, client-side

A vitrine SHALL incluir um campo de busca que filtra, no cliente (sem requisição nova ao backend), a lista de produtos já carregada por `GET /storefront/products`, comparando o texto digitado (case-insensitive, substring) com o `name` de cada produto.

#### Scenario: Busca filtra a grade

- **WHEN** o usuário digita um termo no campo de busca
- **THEN** a grade exibe apenas os produtos cujo `name` contém o termo (sem diferenciar maiúsculas/minúsculas)

#### Scenario: Busca vazia mostra todos

- **WHEN** o campo de busca está vazio
- **THEN** a grade exibe todos os produtos (sujeitos ao filtro de categoria, se houver)

### Requirement: Filtro por categoria, client-side, com nome e sincronizado com a URL

A vitrine SHALL incluir um filtro de categoria (dropdown ou seletor equivalente) exibindo o **nome** de cada categoria (obtido via `GET /storefront/categories`, endpoint público — não o `GET /categories` administrativo, que exige autenticação e quebraria a vitrine para visitantes anônimos —, mapeando `categoryId` → nome), filtrando no cliente a lista de produtos já carregada. O filtro selecionado SHALL ser refletido no query param `categoria` da URL (`/loja?categoria=<categoryId>`), e SHALL ser lido desse query param no carregamento da página (usado pelo clique num banner). Os dois filtros (busca e categoria) SHALL combinar com E lógico.

#### Scenario: Filtro por categoria exibe nomes

- **WHEN** o seletor de categoria é exibido
- **THEN** as opções mostram o nome de cada categoria, não o id

#### Scenario: Selecionar categoria filtra a grade

- **WHEN** o usuário seleciona uma categoria no filtro
- **THEN** a grade exibe apenas os produtos com aquele `categoryId`
- **AND** a URL reflete `?categoria=<categoryId>`

#### Scenario: Filtro pré-selecionado via query param

- **WHEN** a vitrine é acessada com `?categoria=<categoryId>` na URL (ex.: vindo de um clique em banner)
- **THEN** o filtro de categoria já carrega selecionado com essa categoria

#### Scenario: Busca e filtro de categoria combinados

- **WHEN** o usuário tem um termo de busca digitado e uma categoria selecionada ao mesmo tempo
- **THEN** a grade exibe apenas os produtos que atendem às duas condições

### Requirement: Card de produto

Cada card de produto SHALL exibir: imagem de capa (a primeira URL de `images`, se houver; um estado vazio/placeholder caso não haja imagem), nome, preço formatado, e um botão "Adicionar ao carrinho". Produtos com `quantity: 0` SHALL exibir um badge "Esgotado" e o botão "Adicionar ao carrinho" SHALL ficar desabilitado.

#### Scenario: Card completo com estoque disponível

- **WHEN** um produto com `quantity` maior que zero é renderizado
- **THEN** o card exibe imagem (ou placeholder), nome, preço e botão habilitado

#### Scenario: Produto esgotado

- **WHEN** um produto com `quantity: 0` é renderizado
- **THEN** o card exibe o badge "Esgotado"
- **AND** o botão "Adicionar ao carrinho" fica desabilitado

### Requirement: Carrinho persistido em `localStorage`

O frontend SHALL manter o estado do carrinho (itens, quantidades) em `localStorage`, através de um contexto React. O carrinho SHALL sobreviver a um reload da página e NÃO PODE ser sincronizado com o backend.

#### Scenario: Adicionar item ao carrinho

- **WHEN** o usuário clica em "Adicionar ao carrinho" num produto disponível
- **THEN** o item é adicionado (ou tem a quantidade incrementada) no carrinho local

#### Scenario: Carrinho sobrevive a reload

- **WHEN** a página é recarregada (F5) com itens no carrinho
- **THEN** os itens continuam presentes no carrinho após o reload

#### Scenario: Alterar quantidade e remover item

- **WHEN** o usuário altera a quantidade de um item ou o remove do carrinho
- **THEN** o carrinho reflete a alteração e o total é recalculado

### Requirement: Fechamento do pedido chama o backend antes do WhatsApp, e trata estoque insuficiente

Ao finalizar o pedido, o frontend SHALL capturar o nome do cliente (campo obrigatório) e, ao confirmar, SHALL chamar `POST /storefront/checkout` com o nome do cliente e os itens do carrinho **antes** de qualquer interação com o WhatsApp. Se a resposta indicar estoque insuficiente (`422`, `insufficientItems`), o frontend SHALL exibir uma mensagem indicando quais produtos do carrinho ficaram sem estoque suficiente, e NÃO PODE abrir o WhatsApp nem limpar o carrinho. Se o checkout for bem-sucedido (`{ code }`), o frontend SHALL montar a mensagem de texto (nome do cliente, itens com quantidade/preço, total geral, código do pedido e link de consulta) e SHALL abrir `https://wa.me/<numero>?text=<mensagem codificada>`, onde `<numero>` é o `whatsappNumber` obtido via `GET /settings` (sem o caractere `+`), e só então limpar o carrinho.

#### Scenario: Nome do cliente obrigatório

- **WHEN** o usuário tenta finalizar o pedido sem informar o nome
- **THEN** a submissão é bloqueada com mensagem de validação, sem chamar o backend

#### Scenario: Checkout bem-sucedido abre o WhatsApp com o código do pedido

- **WHEN** o usuário finaliza o pedido com o carrinho preenchido, o nome informado, e todos os itens têm estoque suficiente
- **THEN** o frontend chama `POST /storefront/checkout` com sucesso
- **AND** a mensagem gerada contém o nome do cliente, cada item com quantidade e preço, o total geral, o código do pedido e o link de consulta (`<origem>/pedido/<code>`)
- **AND** o link `https://wa.me/<whatsappNumber sem "+">?text=<mensagem>` é aberto e o carrinho é limpo

#### Scenario: Estoque insuficiente bloqueia o WhatsApp e preserva o carrinho

- **WHEN** o usuário finaliza o pedido e ao menos um item do carrinho não tem estoque suficiente
- **THEN** o frontend exibe uma mensagem indicando os produtos problemáticos
- **AND** o WhatsApp NÃO é aberto
- **AND** o carrinho permanece inalterado, permitindo ao usuário ajustar as quantidades

### Requirement: Consulta pública do pedido por código

O frontend SHALL incluir uma rota pública nova (`/pedido/[codigo]`), fora do grupo `(private)`, exibindo o resumo de um pedido (itens, total, nome do cliente, data) obtido via `GET /storefront/orders/:codigo`. Código inexistente SHALL exibir um estado de "pedido não encontrado", sem erro de aplicação.

#### Scenario: Consulta com código existente

- **WHEN** um visitante acessa `/pedido/<codigo>` com um código que existe
- **THEN** a página exibe os itens, o total, o nome do cliente e a data do pedido

#### Scenario: Consulta com código inexistente

- **WHEN** um visitante acessa `/pedido/<codigo>` com um código que não existe
- **THEN** a página exibe um estado de "pedido não encontrado", sem quebrar

### Requirement: Chaves novas no i18n

O frontend SHALL adicionar em `messages.pt.ts` e `messages.en.ts` as chaves novas desta change (ex.: placeholder da busca, rótulo "Todas as categorias" do filtro, mensagem de estoque insuficiente no checkout, "pedido não encontrado"), reaproveitando chaves já cadastradas quando aplicável.

#### Scenario: Mensagens presentes

- **WHEN** os arquivos de i18n são inspecionados
- **THEN** existem as chaves novas desta change em pt e en

### Requirement: Verificação de tipos do frontend e conferência manual

O processo de implementação SHALL executar `npx tsc --noEmit` em `apps/frontend` ao fim das mudanças e sinalizar ao usuário que a UI está pronta para conferência manual. Esta change NÃO PODE acionar verificação automatizada de UI.

#### Scenario: TypeScript limpo

- **WHEN** `npx tsc --noEmit` é executado em `apps/frontend`
- **THEN** o comando termina sem erros novos introduzidos por esta change
