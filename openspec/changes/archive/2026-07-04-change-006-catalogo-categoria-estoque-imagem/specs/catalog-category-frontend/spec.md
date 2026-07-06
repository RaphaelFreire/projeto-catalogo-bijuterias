# catalog-category-frontend Specification

## Purpose
TBD - created by change-006-catalogo-categoria-estoque-imagem. Update Purpose after archive.

## Requirements

### Requirement: Listagem paginada de categorias em rota privada

O frontend SHALL incluir, no módulo `catalog`, uma página de **listagem paginada de categorias** em rota privada, apresentando uma tabela com as colunas `nome` e `ações` (ícones de editar e excluir).

#### Scenario: Tabela renderiza dados do backend

- **WHEN** a página de listagem é acessada por um usuário autenticado
- **THEN** a tabela é renderizada com colunas `nome` e `ações`
- **AND** cada linha exibe os dados retornados por `/categories` (listagem paginada)

#### Scenario: Listagem paginada

- **WHEN** o backend devolve uma página de categorias
- **THEN** a tabela exibe a página atual
- **AND** controles de paginação permitem navegar entre páginas

### Requirement: Formulário de categoria compartilhado entre criação e edição

O frontend SHALL incluir um formulário de categoria compartilhado entre criação e edição, organizado via `form-section-layout`, com uma seção "Dados básicos" contendo o campo `nome`.

#### Scenario: Mesmo formulário em criar e editar

- **WHEN** a tela de criação ou de edição é renderizada
- **THEN** o mesmo componente de formulário é usado

### Requirement: Ações de editar e excluir na coluna de ações

A coluna de ações SHALL conter um ícone de lápis que navega para a tela de edição da categoria e um ícone de lixeira que abre `delete-confirmation-dialog`. Ao confirmar a exclusão, o frontend SHALL chamar o backend e atualizar a tabela.

#### Scenario: Editar abre tela de edição

- **WHEN** o usuário clica no ícone de lápis em uma linha
- **THEN** o roteador navega para a tela de edição daquela categoria
- **AND** o formulário é pré-preenchido com os dados da categoria

#### Scenario: Excluir com confirmação

- **WHEN** o usuário clica no ícone de lixeira em uma linha
- **THEN** o `delete-confirmation-dialog` é exibido

- **WHEN** o usuário confirma a exclusão no diálogo
- **THEN** o frontend chama `DELETE /categories/:id`
- **AND** ao receber sucesso, atualiza a tabela removendo a linha (ou recarregando a página atual)

#### Scenario: Cancelar exclusão não chama backend

- **WHEN** o usuário cancela o `delete-confirmation-dialog`
- **THEN** nenhuma requisição HTTP é feita

### Requirement: Item "Categorias" no menu lateral

A sidebar de navegação SHALL incluir um item "Categorias" apontando para a rota da listagem de categorias.

#### Scenario: Item visível na sidebar

- **WHEN** uma página do grupo `(private)` é renderizada
- **THEN** a sidebar contém um item "Categorias"
- **AND** clicar nele navega para a página de listagem de categorias

### Requirement: Chaves novas no i18n

O frontend SHALL adicionar em `messages.pt.ts` e `messages.en.ts` as chaves novas desta change (ex.: `category.not_found`, mensagens de validação de `name`), reaproveitando chaves já cadastradas quando aplicável.

#### Scenario: Mensagens de validação presentes

- **WHEN** a validação de `name` falha na UI
- **THEN** a mensagem correspondente vem do i18n

### Requirement: Verificação de tipos do frontend e conferência manual

O processo de implementação SHALL executar `npx tsc --noEmit` em `apps/frontend` ao fim das mudanças e sinalizar ao usuário que a UI está pronta para conferência manual. Esta change NÃO PODE acionar verificação automatizada de UI.

#### Scenario: TypeScript limpo

- **WHEN** `npx tsc --noEmit` é executado em `apps/frontend`
- **THEN** o comando termina sem erros novos introduzidos por esta change
