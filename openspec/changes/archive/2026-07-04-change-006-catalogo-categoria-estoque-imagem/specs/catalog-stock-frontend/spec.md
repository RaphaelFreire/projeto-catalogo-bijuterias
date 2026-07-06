# catalog-stock-frontend Specification

## Purpose
TBD - created by change-006-catalogo-categoria-estoque-imagem. Update Purpose after archive.

## Requirements

### Requirement: Listagem paginada de estoque em rota privada

O frontend SHALL incluir, no módulo `catalog`, uma página de **listagem paginada de estoque** em rota privada, apresentando uma tabela com as colunas `produto` (nome), `quantidade` e `ações` (ícones de editar e excluir), mesmo padrão visual das demais listagens do catálogo.

#### Scenario: Tabela renderiza dados do backend

- **WHEN** a página de listagem de estoque é acessada por um usuário autenticado
- **THEN** a tabela é renderizada com colunas `produto`, `quantidade` e `ações`
- **AND** cada linha exibe os dados retornados por `/stock` (listagem paginada)

#### Scenario: Listagem paginada

- **WHEN** o backend devolve uma página de estoque
- **THEN** a tabela exibe a página atual
- **AND** controles de paginação permitem navegar entre páginas

### Requirement: Formulário de estoque compartilhado entre criação e edição

O frontend SHALL incluir um formulário de `stock` compartilhado entre criação e edição, via `form-section-layout`. Em **criação**, o formulário inclui um `select` de produto (listando produtos sem estoque associado) e o campo `quantidade`. Em **edição**, o produto é exibido como somente leitura (não pode ser trocado) e apenas `quantidade` é editável.

#### Scenario: Criação exige produto e quantidade

- **WHEN** a tela de criação de estoque é renderizada
- **THEN** o formulário exibe um select de produto e o campo de quantidade
- **AND** ambos são obrigatórios para submeter

#### Scenario: Edição não permite trocar o produto

- **WHEN** a tela de edição de estoque é renderizada
- **THEN** o produto associado é exibido como somente leitura
- **AND** apenas a quantidade pode ser alterada

### Requirement: Ações de criar, editar e excluir

A listagem SHALL ter um botão de criar novo estoque, e cada linha SHALL ter um ícone de lápis (navega para edição) e um ícone de lixeira (abre `delete-confirmation-dialog`, chama o backend e atualiza a tabela ao confirmar).

#### Scenario: Criar novo estoque

- **WHEN** o usuário aciona o botão de criar novo estoque
- **THEN** o roteador navega para a tela de criação
- **AND** ao submeter com sucesso, o frontend chama `POST /stock`

#### Scenario: Editar quantidade

- **WHEN** o usuário altera a quantidade de um item existente e confirma
- **THEN** o frontend chama `PUT /stock/:id` com a nova quantidade
- **AND** ao receber sucesso, a tabela reflete a quantidade atualizada

#### Scenario: Quantidade inválida bloqueada

- **WHEN** o usuário tenta salvar uma quantidade negativa ou não inteira
- **THEN** a submissão é bloqueada com mensagem de validação, sem chamar o backend

#### Scenario: Excluir com confirmação

- **WHEN** o usuário clica no ícone de lixeira em uma linha
- **THEN** o `delete-confirmation-dialog` é exibido

- **WHEN** o usuário confirma a exclusão no diálogo
- **THEN** o frontend chama `DELETE /stock/:id`
- **AND** ao receber sucesso, atualiza a tabela removendo a linha

#### Scenario: Cancelar exclusão não chama backend

- **WHEN** o usuário cancela o `delete-confirmation-dialog`
- **THEN** nenhuma requisição HTTP é feita

### Requirement: Item "Estoque" no menu lateral

A sidebar de navegação SHALL incluir um item "Estoque" apontando para a rota da listagem de estoque.

#### Scenario: Item visível na sidebar

- **WHEN** uma página do grupo `(private)` é renderizada
- **THEN** a sidebar contém um item "Estoque"
- **AND** clicar nele navega para a página de listagem de estoque

### Requirement: Chaves novas no i18n

O frontend SHALL adicionar em `messages.pt.ts` e `messages.en.ts` as chaves novas desta change (ex.: `stock.not_found`, `stock.product.already_exists`, validação de quantidade negativa/não inteira), reaproveitando chaves já cadastradas quando aplicável.

#### Scenario: Mensagens de validação presentes

- **WHEN** a validação de `quantity` falha na UI, ou o backend rejeita a criação por conflito de produto já ter estoque
- **THEN** as mensagens correspondentes vêm do i18n

### Requirement: Verificação de tipos do frontend e conferência manual

O processo de implementação SHALL executar `npx tsc --noEmit` em `apps/frontend` ao fim das mudanças e sinalizar ao usuário que a UI está pronta para conferência manual. Esta change NÃO PODE acionar verificação automatizada de UI.

#### Scenario: TypeScript limpo

- **WHEN** `npx tsc --noEmit` é executado em `apps/frontend`
- **THEN** o comando termina sem erros novos introduzidos por esta change
