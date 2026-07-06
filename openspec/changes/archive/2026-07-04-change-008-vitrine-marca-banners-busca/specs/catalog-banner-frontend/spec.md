# catalog-banner-frontend Specification

## Purpose
TBD - created by change-008-vitrine-marca-banners-busca. Update Purpose after archive.

## Requirements

### Requirement: Listagem de banners ordenada por posição, sem paginação

O frontend SHALL incluir, no módulo `catalog`, uma página de **listagem de banners** em rota privada, ordenada por `position`, exibindo a miniatura da imagem, o destino (categoria ou link) e ações (subir, descer, editar, excluir). Como o limite é de 3 banners, a listagem NÃO PRECISA de paginação.

#### Scenario: Listagem renderiza banners ordenados

- **WHEN** a página de listagem de banners é acessada por um usuário autenticado
- **THEN** os banners são exibidos na ordem de `position`, com miniatura e destino

### Requirement: Formulário de banner com destino mutuamente exclusivo (categoria ou link) e upload de imagem

O frontend SHALL incluir um formulário de `banner` compartilhado entre criação e edição: seletor de tipo de destino (`Categoria` ou `Link`), exibindo condicionalmente um `select` de categoria (populado por `/categories`) ou um campo de URL, além do upload de imagem. Apenas o campo do tipo selecionado é enviado ao backend; o outro é enviado como `null`. O botão de criar novo banner SHALL ficar desabilitado (com mensagem explicativa) quando já houver 3 banners cadastrados.

#### Scenario: Destino obrigatório, conforme o tipo selecionado

- **WHEN** o usuário tenta submeter o formulário com "Categoria" selecionado, mas sem escolher uma categoria
- **THEN** a submissão é bloqueada com mensagem de validação
- **WHEN** o usuário tenta submeter o formulário com "Link" selecionado, mas sem preencher a URL
- **THEN** a submissão é bloqueada com mensagem de validação

#### Scenario: Troca de tipo de destino limpa o campo anterior

- **WHEN** o usuário edita um banner com destino categoria e alterna para "Link", preenchendo uma URL
- **THEN** o banner salvo passa a ter `linkUrl` preenchida e `categoryId` como `null`

#### Scenario: Criação bloqueada ao atingir o limite

- **WHEN** já existem 3 banners cadastrados
- **THEN** o botão/ação de criar novo banner fica desabilitado, com uma mensagem explicando o limite

#### Scenario: Backend rejeita corrida além do limite

- **WHEN** o backend responde com `422` e `banner.max_reached` (ex.: duas abas tentando criar simultaneamente)
- **THEN** o frontend exibe a mensagem de erro correspondente, sem quebrar a tela

### Requirement: Reordenação via botões subir/descer

Cada linha da listagem SHALL ter botões "subir" e "descer" que trocam a `position` entre o banner da linha e seu vizinho imediato, através de duas chamadas `PUT /banners/:id` (uma para cada banner afetado).

#### Scenario: Subir um banner

- **WHEN** o usuário clica em "subir" num banner que não é o primeiro da lista
- **THEN** o frontend troca a `position` desse banner com a do banner imediatamente anterior
- **AND** a listagem reflete a nova ordem

#### Scenario: Botões desabilitados nas extremidades

- **WHEN** o banner é o primeiro da lista
- **THEN** o botão "subir" fica desabilitado

- **WHEN** o banner é o último da lista
- **THEN** o botão "descer" fica desabilitado

### Requirement: Exclusão com confirmação

A coluna de ações SHALL conter um ícone de lixeira que abre `delete-confirmation-dialog`. Ao confirmar, o frontend SHALL chamar `DELETE /banners/:id` e atualizar a listagem.

#### Scenario: Excluir com confirmação

- **WHEN** o usuário confirma a exclusão no diálogo
- **THEN** o frontend chama `DELETE /banners/:id`
- **AND** ao receber sucesso, atualiza a listagem removendo o banner

### Requirement: Item "Banners" no menu lateral

A sidebar de navegação SHALL incluir um item "Banners" apontando para a rota da listagem de banners.

#### Scenario: Item visível na sidebar

- **WHEN** uma página do grupo `(private)` é renderizada
- **THEN** a sidebar contém um item "Banners"

### Requirement: Chaves novas no i18n

O frontend SHALL adicionar em `messages.pt.ts` e `messages.en.ts` as chaves novas desta change (`banner.not_found`, `banner.max_reached`, validações de `imageUrl`/`position`/`categoryId`/`linkUrl`, `banner.destination.required`, `banner.destination.exclusive`), reaproveitando chaves já cadastradas quando aplicável.

#### Scenario: Mensagens presentes

- **WHEN** os arquivos de i18n são inspecionados
- **THEN** existem as chaves novas desta change em pt e en

### Requirement: Verificação de tipos do frontend e conferência manual

O processo de implementação SHALL executar `npx tsc --noEmit` em `apps/frontend` ao fim das mudanças e sinalizar ao usuário que a UI está pronta para conferência manual. Esta change NÃO PODE acionar verificação automatizada de UI.

#### Scenario: TypeScript limpo

- **WHEN** `npx tsc --noEmit` é executado em `apps/frontend`
- **THEN** o comando termina sem erros novos introduzidos por esta change
