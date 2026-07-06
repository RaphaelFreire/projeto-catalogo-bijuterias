## ADDED Requirements

### Requirement: Chave i18n `user.credentials.invalid`

O frontend SHALL incluir, em `apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`, a chave `user.credentials.invalid` com mensagem genérica em português ("E-mail ou senha inválidos.") e inglês ("Invalid email or password.").

#### Scenario: Chave presente nos dois arquivos

- **WHEN** os arquivos de i18n são inspecionados
- **THEN** ambos contêm a chave `user.credentials.invalid` com a tradução correspondente
- **AND** o padrão de organização do arquivo é preservado

### Requirement: Integração do formulário de login com o backend

O formulário de **login** em `apps/frontend/src/modules/auth/components/auth.component.tsx` SHALL chamar `POST {NEXT_PUBLIC_API_URL}/auth/login` via `fetch` nativo (sem cliente HTTP adicional) com corpo `{ email, password }`. Em sucesso (`200`), SHALL chamar `auth.login(response.token)` e `router.push('/example/dashboard')`. Em erro, SHALL parsear `ApiErrorResponse`, iterar `errors[]` e disparar um `toast.error(getMessage(code))` por item — um toaster individual por mensagem (mesmo padrão do cadastro).

#### Scenario: Login bem-sucedido

- **WHEN** o usuário submete o formulário de login com credenciais válidas e o backend responde `200`
- **THEN** `auth.login(response.token)` é chamado
- **AND** o roteador navega para `/example/dashboard`
- **AND** opcionalmente um `toast.success` é exibido

#### Scenario: Erro genérico de credenciais

- **WHEN** o backend responde `401` com `errors: ['user.credentials.invalid']`
- **THEN** um `toast.error` é exibido com a mensagem traduzida ("E-mail ou senha inválidos." ou equivalente em inglês)
- **AND** nenhum cookie é gravado
- **AND** o usuário permanece na tela `/join`

#### Scenario: Múltiplos erros de validação

- **WHEN** o backend responde com múltiplos códigos em `errors[]`
- **THEN** um `toast.error(getMessage(code))` é disparado para cada item

### Requirement: Redirecionamento automático em `/join` quando autenticado

A tela `/join` SHALL detectar sessão ativa via `useAuth()` e redirecionar automaticamente para `/example/dashboard` quando `status === 'authenticated'`. Enquanto `status === 'loading'`, o formulário NÃO PODE ser renderizado (para evitar flash).

#### Scenario: Usuário autenticado em `/join`

- **WHEN** um usuário com sessão ativa acessa `/join`
- **THEN** ele é redirecionado para `/example/dashboard` automaticamente

#### Scenario: Estado de loading não renderiza formulário

- **WHEN** `useAuth().status === 'loading'` na tela `/join`
- **THEN** o formulário não é renderizado
- **AND** nenhum flash de tela pública é exibido para usuários com sessão

### Requirement: Validação manual no navegador

O processo de implementação SHALL validar manualmente no navegador e registrar evidência (print ou descrição) dos seguintes cenários:

1. Login com credenciais válidas → cookie `auth_token` presente, redirecionamento para `/example/dashboard`, dropdown do header exibindo `name` e `email` do usuário, incluindo um caso com acentuação (ex.: cadastrar e logar `José da Conceição`).
2. Login com senha errada → toaster "E-mail ou senha inválidos.", sem cookie gravado.
3. Recarregar `/example/dashboard` após login → permanece autenticado, sem flash de tela pública.
4. Fechar e reabrir o navegador → sessão preservada (cookie sobrevive).
5. Acessar `/example/dashboard` deslogado → redireciona para `/join`.
6. Acessar `/join` logado → redireciona para `/example/dashboard`.
7. Clicar em "Logout" no dropdown → cookie removido, redireciona para `/join`.
8. `npx tsc --noEmit` sem erros novos.

#### Scenario: Evidências cobrindo todos os cenários

- **WHEN** as tarefas de validação manual são concluídas
- **THEN** a evidência cobre os oito cenários acima
- **AND** a acentuação é preservada no caso `José da Conceição`
