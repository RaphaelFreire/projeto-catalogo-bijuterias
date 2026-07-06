# storefront-frontend Specification

## Purpose
TBD - created by change-007-vitrine-publica-whatsapp. Extended by change-009-pedido-desconto-estoque (checkout chama o backend, consulta pública de pedido por código). Update Purpose after archive.

## Requirements

### Requirement: Rota pública `/loja` com layout próprio

O frontend SHALL incluir uma rota pública nova (`/loja`), fora do grupo `(private)` e fora do `PublicBoxedLayout` (layout de autenticação em caixa centralizada). Esta rota usa um layout próprio, de largura total.

#### Scenario: Rota acessível sem autenticação

- **WHEN** um visitante sem sessão acessa `/loja`
- **THEN** a vitrine é renderizada normalmente, sem redirecionamento para login

### Requirement: Grade responsiva de produtos

A vitrine SHALL exibir os produtos retornados por `GET /storefront/products` em uma grade responsiva: 1–2 colunas em telas mobile, 2–3 em tablet, 3–4 em desktop.

#### Scenario: Grade reflow por tamanho de tela

- **WHEN** a vitrine é renderizada em diferentes larguras de viewport
- **THEN** o número de colunas se ajusta conforme o breakpoint (mobile/tablet/desktop)

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

O frontend SHALL adicionar em `messages.pt.ts` e `messages.en.ts` as chaves novas desta change (ex.: mensagem de estoque insuficiente no checkout, "pedido não encontrado"), reaproveitando chaves já cadastradas quando aplicável.

#### Scenario: Mensagens presentes

- **WHEN** os arquivos de i18n são inspecionados
- **THEN** existem as chaves novas desta change em pt e en

### Requirement: Verificação de tipos do frontend e conferência manual

O processo de implementação SHALL executar `npx tsc --noEmit` em `apps/frontend` ao fim das mudanças e sinalizar ao usuário que a UI está pronta para conferência manual. Esta change NÃO PODE acionar verificação automatizada de UI.

#### Scenario: TypeScript limpo

- **WHEN** `npx tsc --noEmit` é executado em `apps/frontend`
- **THEN** o comando termina sem erros novos introduzidos por esta change
