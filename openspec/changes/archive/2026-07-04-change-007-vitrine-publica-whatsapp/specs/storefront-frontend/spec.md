# storefront-frontend Specification

## Purpose
TBD - created by change-007-vitrine-publica-whatsapp. Update Purpose after archive.

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

Cada card de produto SHALL exibir: imagem de capa (a primeira URL de `images`, se houver; um estado vazio/placeholder caso não haja imagem), nome, descrição truncada em 2 linhas, preço formatado, e um botão "Adicionar ao carrinho". Produtos com `quantity: 0` SHALL exibir um badge "Esgotado" e o botão "Adicionar ao carrinho" SHALL ficar desabilitado.

#### Scenario: Card completo com estoque disponível

- **WHEN** um produto com `quantity` maior que zero é renderizado
- **THEN** o card exibe imagem (ou placeholder), nome, descrição truncada em 2 linhas, preço e botão habilitado

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

### Requirement: Fechamento do pedido captura o nome do cliente e gera link de WhatsApp

Ao finalizar o pedido, o frontend SHALL capturar o nome do cliente (campo obrigatório) e, ao confirmar, SHALL montar uma mensagem de texto contendo o nome do cliente, a lista de itens do carrinho (quantidade, nome do produto e preço) e o total geral, e SHALL abrir `https://wa.me/<numero>?text=<mensagem codificada>`, onde `<numero>` é o `whatsappNumber` obtido via `GET /settings` (sem o caractere `+`) e `<mensagem codificada>` usa `encodeURIComponent`.

#### Scenario: Nome do cliente obrigatório

- **WHEN** o usuário tenta finalizar o pedido sem informar o nome
- **THEN** a submissão é bloqueada com mensagem de validação

#### Scenario: Mensagem contém nome, itens e total

- **WHEN** o usuário finaliza o pedido com o carrinho preenchido e o nome informado
- **THEN** a mensagem gerada contém o nome do cliente, cada item com quantidade e preço, e o total geral

#### Scenario: Link do WhatsApp usa o número configurado

- **WHEN** o pedido é finalizado
- **THEN** o link aberto é `https://wa.me/<whatsappNumber sem "+">?text=<mensagem>`, com `whatsappNumber` obtido de `GET /settings`

### Requirement: Chaves novas no i18n

O frontend SHALL adicionar em `messages.pt.ts` e `messages.en.ts` as chaves novas desta change (ex.: rótulo "Esgotado", validação do nome do cliente), reaproveitando chaves já cadastradas quando aplicável.

#### Scenario: Mensagens presentes

- **WHEN** os arquivos de i18n são inspecionados
- **THEN** existem as chaves novas desta change em pt e en

### Requirement: Verificação de tipos do frontend e conferência manual

O processo de implementação SHALL executar `npx tsc --noEmit` em `apps/frontend` ao fim das mudanças e sinalizar ao usuário que a UI está pronta para conferência manual. Esta change NÃO PODE acionar verificação automatizada de UI.

#### Scenario: TypeScript limpo

- **WHEN** `npx tsc --noEmit` é executado em `apps/frontend`
- **THEN** o comando termina sem erros novos introduzidos por esta change
