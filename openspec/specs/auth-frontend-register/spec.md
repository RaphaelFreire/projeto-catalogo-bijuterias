# auth-frontend-register Specification

## Purpose
TBD - created by archiving change change-002-registrar-usuario. Update Purpose after archive.
## Requirements
### Requirement: Tela `/join` com alternância entre cadastro e login

O frontend SHALL substituir o conteúdo de `app/(public)/join/page.tsx` por um componente com estado `mode` (`'register' | 'login'`) que alterna entre o formulário de cadastro e o formulário de login via botão/link de troca, sem criar componentes fora desse diretório (apenas reaproveitando o que já existe em `shared/`).

#### Scenario: Alternância entre modos

- **WHEN** o usuário acessa `/join`
- **THEN** uma das duas views (`register` ou `login`) é renderizada conforme o `mode` atual
- **AND** existe um botão/link visível que alterna o `mode` entre `register` e `login`

### Requirement: Formulário de cadastro integrado ao backend

O formulário de **cadastro** SHALL conter os campos `name`, `email` e `password` (apenas com `required` como validação client-side) e, ao submeter, chamar `POST {NEXT_PUBLIC_API_URL}/auth/register` via `fetch` nativo com corpo `{ name, email, password }`.

#### Scenario: Cadastro bem-sucedido

- **WHEN** o usuário submete o formulário de cadastro com dados válidos e o backend responde `201`
- **THEN** o frontend dispara `toast.success` com mensagem de confirmação
- **AND** o usuário não é redirecionado

#### Scenario: Cadastro com erros

- **WHEN** o backend responde com erro e corpo no formato `ApiErrorResponse`
- **THEN** o frontend parseia `errors[]`
- **AND** dispara um `toast.error(getMessage(code))` para cada item de `errors[]` — um toaster individual por erro
- **AND** o usuário não é redirecionado

#### Scenario: Sem validação client-side adicional

- **WHEN** o formulário de cadastro é inspecionado
- **THEN** os campos têm apenas o atributo `required` como validação
- **AND** a validação de regras de negócio é responsabilidade do backend

### Requirement: Formulário de login com estrutura visual

O formulário de **login** SHALL conter os campos `email` e `password` com botão de submissão. O handler de submit pode ser no-op ou chamar `toast.info('Login em breve')`, sem chamar nenhum endpoint nesta change.

#### Scenario: Submissão do login não chama backend

- **WHEN** o usuário submete o formulário de login
- **THEN** nenhuma requisição HTTP é feita pelo frontend
- **AND** opcionalmente um `toast.info('Login em breve')` pode ser exibido

### Requirement: Validação manual no navegador

O processo de implementação SHALL validar manualmente no navegador os seguintes cenários e registrar evidência (print ou descrição):

- Alternância entre modos cadastro e login.
- Cadastro com dados válidos exibindo toaster de sucesso.
- Cadastro com e-mail já cadastrado (`409`) exibindo toaster com a mensagem de duplicidade.
- Cadastro com senha fraca (`422`) exibindo toaster com a mensagem correspondente.
- Cadastro com múltiplos campos inválidos exibindo um toaster por erro retornado.

#### Scenario: Evidências de validação manual registradas

- **WHEN** as tarefas de validação manual são concluídas
- **THEN** a evidência cobre os cinco cenários acima
- **AND** os toasters comportam-se conforme especificado (um por mensagem em caso de múltiplos erros)

