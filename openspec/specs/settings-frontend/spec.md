# settings-frontend Specification

## Purpose
TBD - created by change-007-vitrine-publica-whatsapp. Extended by change-008-vitrine-marca-banners-busca (upload/preview/remoção de logo). Update Purpose after archive.

## Requirements

### Requirement: Tela única de configurações, sem listagem/criar/excluir do registro

O frontend SHALL incluir, no módulo `settings`, uma única página administrativa em rota privada para visualizar e editar o `whatsappNumber` e a logo da loja. Esta tela NÃO PODE ter listagem, botão de "criar novo" nem ação de excluir o registro inteiro — é sempre o mesmo registro único, carregado e editado no lugar.

#### Scenario: Tela carrega o valor atual

- **WHEN** a página de configurações é acessada por um usuário autenticado
- **THEN** o campo `whatsappNumber` é pré-preenchido com o valor retornado por `GET /settings`
- **AND** se ainda não houver configuração, o campo aparece vazio, sem erro
- **AND** se houver `logoUrl`, a logo atual é exibida em preview

#### Scenario: Sem ações de criar/excluir o registro

- **WHEN** a página de configurações é renderizada
- **THEN** não existe botão de "nova configuração" nem ação de exclusão do registro inteiro

#### Scenario: Salvar atualiza o registro

- **WHEN** o usuário altera o `whatsappNumber` e confirma
- **THEN** o frontend chama `PUT /settings`
- **AND** ao receber sucesso, exibe confirmação de que a configuração foi salva

#### Scenario: Validação de formato

- **WHEN** o usuário informa um `whatsappNumber` fora do formato esperado
- **THEN** a submissão é bloqueada com mensagem de validação, ou o backend rejeita e a mensagem correspondente é exibida

### Requirement: Upload, preview e remoção da logo

A tela de configurações SHALL incluir uma seção de logo com upload de arquivo, preview da imagem atual (quando configurada) e ação de remover.

#### Scenario: Upload de logo

- **WHEN** o usuário seleciona um arquivo de imagem na seção de logo
- **THEN** o frontend chama `POST /settings/logo`
- **AND** ao receber sucesso, o preview é atualizado com a nova logo

#### Scenario: Remoção de logo

- **WHEN** o usuário aciona a remoção da logo configurada
- **THEN** o frontend chama `DELETE /settings/logo`
- **AND** ao receber sucesso, o preview volta ao estado vazio/placeholder

### Requirement: Item "Configurações" no menu lateral

A sidebar de navegação SHALL incluir um item "Configurações" apontando para a página de configurações.

#### Scenario: Item visível na sidebar

- **WHEN** uma página do grupo `(private)` é renderizada
- **THEN** a sidebar contém um item "Configurações"
- **AND** clicar nele navega para a página de configurações

### Requirement: Chaves novas no i18n

O frontend SHALL adicionar em `messages.pt.ts` e `messages.en.ts` as chaves novas desta change (validação de `logoUrl`, mensagens de sucesso/erro do upload/remoção), reaproveitando chaves já cadastradas quando aplicável.

#### Scenario: Mensagens de validação presentes

- **WHEN** a validação de `whatsappNumber` ou `logoUrl` falha na UI
- **THEN** a mensagem correspondente vem do i18n

### Requirement: Verificação de tipos do frontend e conferência manual

O processo de implementação SHALL executar `npx tsc --noEmit` em `apps/frontend` ao fim das mudanças e sinalizar ao usuário que a UI está pronta para conferência manual. Esta change NÃO PODE acionar verificação automatizada de UI.

#### Scenario: TypeScript limpo

- **WHEN** `npx tsc --noEmit` é executado em `apps/frontend`
- **THEN** o comando termina sem erros novos introduzidos por esta change
