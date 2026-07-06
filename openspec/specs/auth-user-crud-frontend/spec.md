# auth-user-crud-frontend Specification

## Purpose
TBD - created by archiving change change-004-cadastro-usuario. Update Purpose after archive.
## Requirements
### Requirement: Listagem paginada de usuários em rota privada

O frontend SHALL incluir, no módulo `auth`, uma página de **listagem paginada de usuários** em rota privada (dentro do grupo `(private)`), apresentando uma tabela com as colunas `nome`, `e-mail` e `ações` (ícones de editar e excluir).

#### Scenario: Tabela renderiza dados do backend

- **WHEN** a página de listagem é acessada por um usuário autenticado
- **THEN** a tabela é renderizada com colunas `nome`, `e-mail` e `ações`
- **AND** cada linha exibe os dados retornados por `/users` (listagem paginada)

#### Scenario: Listagem paginada

- **WHEN** o backend devolve uma página de usuários
- **THEN** a tabela exibe a página atual
- **AND** controles de paginação permitem navegar entre páginas

### Requirement: Formulário compartilhado entre criação e edição

O frontend SHALL incluir, no módulo `auth`, um **formulário de usuário compartilhado** entre criação e edição, organizado em seções via `apps/frontend/src/shared/components/ui/form-section-layout.tsx`. As seções SHALL ser: "Dados básicos" (`nome`, `e-mail`) e "Senha" (`senha` + `confirmação`).

#### Scenario: Mesmo formulário em criar e editar

- **WHEN** a tela de criação ou de edição é renderizada
- **THEN** o mesmo componente de formulário é usado
- **AND** as seções "Dados básicos" e "Senha" são renderizadas via `form-section-layout`

#### Scenario: Confirmação de senha valida no frontend

- **WHEN** o usuário submete o formulário com `senha` diferente de `confirmação`
- **THEN** o frontend exibe erro correspondente
- **AND** a requisição NÃO é enviada ao backend

#### Scenario: Backend recebe apenas `password`

- **WHEN** o formulário é submetido com sucesso
- **THEN** o corpo enviado ao backend contém `name`, `email` e `password` (sem `confirmation`)

#### Scenario: Edição com senha em branco mantém senha atual

- **WHEN** o usuário edita um usuário e deixa `senha` e `confirmação` vazios
- **THEN** o formulário envia o corpo sem `password` (ou com `password` vazio)
- **AND** o backend mantém o `passwordHash` atual

### Requirement: Ações de editar e excluir na coluna de ações

A coluna de ações SHALL conter um ícone de **lápis** que navega para a tela de edição do usuário e um ícone de **lixeira** que abre `apps/frontend/src/shared/components/ui/delete-confirmation-dialog.tsx`. Ao confirmar a exclusão, o frontend SHALL chamar o backend e atualizar a tabela.

#### Scenario: Editar abre tela de edição

- **WHEN** o usuário clica no ícone de lápis em uma linha
- **THEN** o roteador navega para a tela de edição daquele usuário
- **AND** o formulário é pré-preenchido com os dados do usuário

#### Scenario: Excluir com confirmação

- **WHEN** o usuário clica no ícone de lixeira em uma linha
- **THEN** o `delete-confirmation-dialog` é exibido

- **WHEN** o usuário confirma a exclusão no diálogo
- **THEN** o frontend chama `DELETE /users/:id`
- **AND** ao receber sucesso, atualiza a tabela removendo a linha (ou recarregando a página atual)

#### Scenario: Cancelar exclusão não chama backend

- **WHEN** o usuário cancela o `delete-confirmation-dialog`
- **THEN** nenhuma requisição HTTP é feita
- **AND** a tabela permanece inalterada

### Requirement: Item "Usuários" no menu lateral

A sidebar de navegação SHALL incluir um item "Usuários" apontando para a rota da listagem de usuários.

#### Scenario: Item visível na sidebar

- **WHEN** uma página do grupo `(private)` é renderizada
- **THEN** a sidebar contém um item "Usuários"
- **AND** clicar nele navega para a página de listagem

### Requirement: Chaves novas no i18n

O frontend SHALL adicionar em `apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts` as chaves novas que aparecerem nesta change (ex.: `user.not_found`, mensagem de divergência entre senha e confirmação), em português e inglês, reaproveitando as chaves já cadastradas em changes anteriores quando aplicável.

#### Scenario: Novas chaves presentes nos dois idiomas

- **WHEN** os arquivos de i18n são inspecionados após a change
- **THEN** todas as chaves novas usadas pela UI desta change estão presentes em pt e en
- **AND** o padrão de organização do arquivo é preservado

#### Scenario: Chaves existentes reaproveitadas

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
