## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Why

As changes anteriores entregaram cadastro inicial (`register-user`) e login (`login-user`) do módulo `auth`, mas não há ainda CRUD completo de usuários para administração. Esta change entrega o CRUD de usuário no módulo `auth` (criar/atualizar via `save-user`, excluir via `delete-user`, listar e obter por id), expondo no backend via `UserController` e no frontend via listagem paginada + formulário compartilhado. Esta entrega serve como **referência** para os próximos cadastros administrativos do projeto.

## What Changes

- Implementar o caso de uso `save-user` no módulo `auth` cobrindo criação e atualização (decisão por `findById`: se `id` vier na entrada e existir, atualiza; senão cria com o `id` recebido ou gerando novo). Em edição sem `password`, manter o hash atual.
- Implementar o caso de uso `delete-user` no módulo `auth`.
- Cobrir os dois casos de uso com testes unitários reaproveitando `FakeUserRepository` e `FakeCryptoProvider`.
- Manter `register-user` e `login-user` intactos — `save-user` é distinto, não substitui nem funde.
- Criar `apps/backend/src/modules/auth/user.controller.ts` expondo `/users` autenticado: criar, atualizar, excluir, obter por id e listar paginado. Consultas chamam o repositório direto; comandos instanciam o caso de uso. Respostas de leitura SHALL ser mapeadas para objetos simples no controller (entidades de domínio não serializam).
- Criar `apps/backend/src/modules/auth/user.integration.http` cobrindo o CRUD e os principais erros.
- Frontend: listagem paginada de usuários no módulo `auth` em rota privada, com colunas nome/e-mail e ações editar/excluir.
- Frontend: formulário compartilhado entre criação e edição, organizado em seções via `form-section-layout` (Dados básicos: nome, e-mail; Senha: senha + confirmação). Confirmação de senha é responsabilidade do front-end.
- Integrar a coluna de ações: lápis navega para edição; lixeira abre `delete-confirmation-dialog` e, ao confirmar, chama o backend e atualiza a tabela.
- Adicionar item "Usuários" no menu lateral apontando para a listagem.
- Acrescentar no i18n as chaves novas que surgirem (ex.: `user.not_found`, divergência de senha/confirmação). Reaproveitar chaves já cadastradas.
- Rodar `npx tsc --noEmit` em `apps/frontend` e sinalizar ao usuário que a UI está pronta para conferência manual.
- **Sem verificação automatizada de UI nesta change**: validações automatizadas vão até a camada de backend (unit + Rest Client); o usuário valida a interface manualmente.

## Capabilities

### New Capabilities

- `auth-user-crud-domain`: Casos de uso `save-user` (cria/atualiza) e `delete-user` no módulo `auth`, com cobertura por testes unitários.
- `auth-user-crud-backend`: `UserController` expondo o CRUD autenticado em `/users`, mapeamento de leitura para objetos simples e cobertura HTTP em `user.integration.http`.
- `auth-user-crud-frontend`: Listagem paginada, formulário compartilhado (cria/edita) com seções, ações de edição/exclusão, item de menu "Usuários" e i18n complementar — sem verificação automatizada de UI.

### Modified Capabilities

<!-- Nenhuma capability existente é modificada em nível de requisito. As capabilities anteriores (auth-domain, auth-backend, auth-frontend-register, auth-login-domain, auth-login-backend, auth-frontend-session, auth-frontend-login) permanecem inalteradas. Esta change estende o módulo `auth` com novos casos de uso e novas superfícies (controller de usuário e telas administrativas), sem alterar comportamento existente. -->

## Impact

- Adiciona ao módulo `auth` os casos de uso `save-user` e `delete-user` e seus testes.
- Adiciona ao backend o controller `apps/backend/src/modules/auth/user.controller.ts` e o arquivo de testes `user.integration.http`.
- Adiciona ao frontend a listagem em rota privada dentro do módulo `auth`, formulário compartilhado e item de menu "Usuários".
- Estende `messages.pt.ts` e `messages.en.ts` com chaves novas que aparecerem (ex.: `user.not_found`, divergência de senha).
- Habilita changes futuras de outros cadastros administrativos a usarem este CRUD como referência (mesmo padrão de listagem, formulário compartilhado e diálogo de confirmação).
