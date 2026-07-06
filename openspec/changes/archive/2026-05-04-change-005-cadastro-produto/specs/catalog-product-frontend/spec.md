## ADDED Requirements

### Requirement: Listagem paginada de produtos em rota privada

O frontend SHALL incluir, no módulo `catalog`, uma página de **listagem paginada de produtos** em rota privada (dentro do grupo `(private)`), apresentando uma tabela com as colunas `nome`, `preço`, `status` e `ações` (ícones de editar e excluir).

#### Scenario: Tabela renderiza dados do backend

- **WHEN** a página de listagem é acessada por um usuário autenticado
- **THEN** a tabela é renderizada com colunas `nome`, `preço`, `status` e `ações`
- **AND** cada linha exibe os dados retornados por `/products` (listagem paginada)

#### Scenario: Listagem paginada

- **WHEN** o backend devolve uma página de produtos
- **THEN** a tabela exibe a página atual
- **AND** controles de paginação permitem navegar entre páginas

### Requirement: Formulário compartilhado em três seções

O frontend SHALL incluir, no módulo `catalog`, um **formulário de produto compartilhado** entre criação e edição, organizado em seções via `apps/frontend/src/shared/components/ui/form-section-layout.tsx`. As seções SHALL ser:

- **"Dados básicos"**: `nome`, `descrição`.
- **"Preço e status"**: `preço`, `status` como `select` com as opções `active`, `inactive`, `draft`.
- **"Disponibilidade"**: checkboxes `availableOnline`, `featured`, `allowsPreOrder`.

#### Scenario: Mesmo formulário em criar e editar

- **WHEN** a tela de criação ou de edição é renderizada
- **THEN** o mesmo componente de formulário é usado
- **AND** as três seções são renderizadas via `form-section-layout`

#### Scenario: Select de status com as três opções

- **WHEN** o select de `status` é exibido
- **THEN** ele oferece as opções `active`, `inactive` e `draft`
- **AND** o rótulo de cada opção vem do i18n (`product.status.active|inactive|draft`)

#### Scenario: Checkboxes independentes

- **WHEN** o usuário marca/desmarca `availableOnline`, `featured` ou `allowsPreOrder`
- **THEN** cada checkbox altera apenas o próprio campo, sem interferir nos demais

### Requirement: Ações de editar e excluir na coluna de ações

A coluna de ações SHALL conter um ícone de **lápis** que navega para a tela de edição do produto e um ícone de **lixeira** que abre `apps/frontend/src/shared/components/ui/delete-confirmation-dialog.tsx`. Ao confirmar a exclusão, o frontend SHALL chamar o backend e atualizar a tabela.

#### Scenario: Editar abre tela de edição

- **WHEN** o usuário clica no ícone de lápis em uma linha
- **THEN** o roteador navega para a tela de edição daquele produto
- **AND** o formulário é pré-preenchido com os dados do produto

#### Scenario: Excluir com confirmação

- **WHEN** o usuário clica no ícone de lixeira em uma linha
- **THEN** o `delete-confirmation-dialog` é exibido

- **WHEN** o usuário confirma a exclusão no diálogo
- **THEN** o frontend chama `DELETE /products/:id`
- **AND** ao receber sucesso, atualiza a tabela removendo a linha (ou recarregando a página atual)

#### Scenario: Cancelar exclusão não chama backend

- **WHEN** o usuário cancela o `delete-confirmation-dialog`
- **THEN** nenhuma requisição HTTP é feita
- **AND** a tabela permanece inalterada

### Requirement: Item "Produtos" no menu lateral

A sidebar de navegação SHALL incluir um item "Produtos" apontando para a rota da listagem de produtos.

#### Scenario: Item visível na sidebar

- **WHEN** uma página do grupo `(private)` é renderizada
- **THEN** a sidebar contém um item "Produtos"
- **AND** clicar nele navega para a página de listagem de produtos

### Requirement: Chaves novas no i18n

O frontend SHALL adicionar em `apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts` as chaves novas que aparecerem nesta change (ex.: `product.not_found`, rótulos `product.status.active`, `product.status.inactive`, `product.status.draft`, e mensagens específicas de validação dos novos campos), em português e inglês, reaproveitando chaves já cadastradas em changes anteriores quando aplicável.

#### Scenario: Rótulos de status presentes

- **WHEN** os arquivos de i18n são inspecionados
- **THEN** existem as chaves `product.status.active`, `product.status.inactive` e `product.status.draft` em pt e en

#### Scenario: Mensagens de validação dos campos novos

- **WHEN** validações de `name`, `description`, `price` e `status` falham na UI
- **THEN** as mensagens correspondentes vêm do i18n com chaves preservando o padrão existente

#### Scenario: Reaproveitamento de chaves existentes

- **WHEN** uma mensagem necessária já existe nos arquivos de i18n
- **THEN** ela é reaproveitada em vez de duplicada com nova chave

### Requirement: Verificação de tipos do frontend e conferência manual

O processo de implementação SHALL executar `npx tsc --noEmit` em `apps/frontend` ao fim das mudanças e sinalizar ao usuário que a UI está pronta para conferência manual. Esta change NÃO PODE acionar verificação automatizada de UI (`mcp__Claude_Preview` ou `mcp__Claude_in_Chrome`).

#### Scenario: TypeScript limpo

- **WHEN** `npx tsc --noEmit` é executado em `apps/frontend`
- **THEN** o comando termina sem erros novos introduzidos por esta change

#### Scenario: Sem verificação automatizada de UI

- **WHEN** as tasks desta change são executadas
- **THEN** nenhuma chamada a `mcp__Claude_Preview` ou `mcp__Claude_in_Chrome` é feita
- **AND** a conferência da UI é feita manualmente pelo usuário
