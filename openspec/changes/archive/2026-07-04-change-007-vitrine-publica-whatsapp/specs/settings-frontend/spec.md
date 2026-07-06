# settings-frontend Specification

## Purpose
TBD - created by change-007-vitrine-publica-whatsapp. Update Purpose after archive.

## Requirements

### Requirement: Tela única de configurações, sem listagem/criar/excluir

O frontend SHALL incluir, no módulo `settings`, uma única página administrativa em rota privada para visualizar e editar o `whatsappNumber` da loja. Esta tela NÃO PODE ter listagem, botão de "criar novo" nem ação de excluir — é sempre o mesmo registro único, carregado e editado no lugar.

#### Scenario: Tela carrega o valor atual

- **WHEN** a página de configurações é acessada por um usuário autenticado
- **THEN** o campo `whatsappNumber` é pré-preenchido com o valor retornado por `GET /settings`
- **AND** se ainda não houver configuração, o campo aparece vazio, sem erro

#### Scenario: Sem ações de criar/excluir

- **WHEN** a página de configurações é renderizada
- **THEN** não existe botão de "nova configuração" nem ação de exclusão

#### Scenario: Salvar atualiza o registro

- **WHEN** o usuário altera o `whatsappNumber` e confirma
- **THEN** o frontend chama `PUT /settings`
- **AND** ao receber sucesso, exibe confirmação de que a configuração foi salva

#### Scenario: Validação de formato

- **WHEN** o usuário informa um `whatsappNumber` fora do formato esperado
- **THEN** a submissão é bloqueada com mensagem de validação, ou o backend rejeita e a mensagem correspondente é exibida

### Requirement: Item "Configurações" no menu lateral

A sidebar de navegação SHALL incluir um item "Configurações" apontando para a página de configurações.

#### Scenario: Item visível na sidebar

- **WHEN** uma página do grupo `(private)` é renderizada
- **THEN** a sidebar contém um item "Configurações"
- **AND** clicar nele navega para a página de configurações

### Requirement: Chaves novas no i18n

O frontend SHALL adicionar em `messages.pt.ts` e `messages.en.ts` as chaves novas desta change (validação de `whatsappNumber`), reaproveitando chaves já cadastradas quando aplicável.

#### Scenario: Mensagens de validação presentes

- **WHEN** a validação de `whatsappNumber` falha na UI
- **THEN** a mensagem correspondente vem do i18n

### Requirement: Verificação de tipos do frontend e conferência manual

O processo de implementação SHALL executar `npx tsc --noEmit` em `apps/frontend` ao fim das mudanças e sinalizar ao usuário que a UI está pronta para conferência manual. Esta change NÃO PODE acionar verificação automatizada de UI.

#### Scenario: TypeScript limpo

- **WHEN** `npx tsc --noEmit` é executado em `apps/frontend`
- **THEN** o comando termina sem erros novos introduzidos por esta change
