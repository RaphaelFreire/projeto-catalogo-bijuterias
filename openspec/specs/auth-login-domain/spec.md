# auth-login-domain Specification

## Purpose
TBD - created by archiving change change-003-login-usuario. Update Purpose after archive.
## Requirements
### Requirement: Caso de uso `login-user` puro de transporte

O agregado `user` do módulo `auth` SHALL implementar o caso de uso `login-user` que recebe `{ email, password }` e devolve `{ id: string; name: string; email: string }`. O caso de uso NÃO PODE conhecer, importar ou referenciar token, JWT, sessão ou qualquer detalhe de transporte HTTP. NÃO PODE existir abstração `TokenProvider` no domínio.

#### Scenario: Domínio sem referência a JWT/token

- **WHEN** o código do módulo `modules/auth` é inspecionado
- **THEN** nenhum arquivo do agregado `user` importa ou menciona JWT, token ou sessão
- **AND** não existe `TokenProvider` no módulo de negócio

#### Scenario: Saída do caso de uso é apenas o usuário público

- **WHEN** `login-user` é executado com sucesso
- **THEN** o retorno contém exatamente `{ id, name, email }`
- **AND** não contém `password` nem `passwordHash`

### Requirement: Validação de entrada do `login-user`

O caso de uso `login-user` SHALL validar a entrada antes de qualquer acesso ao repositório, aplicando `RequiredRule` + `EmailRule` ao `email` e `RequiredRule` ao `password`.

#### Scenario: E-mail inválido

- **WHEN** `login-user` é chamado com `email` mal formatado
- **THEN** o caso de uso falha com erro de validação correspondente
- **AND** o repositório não é consultado

#### Scenario: E-mail vazio

- **WHEN** `login-user` é chamado com `email` vazio
- **THEN** o caso de uso falha com erro de validação correspondente

#### Scenario: Senha vazia

- **WHEN** `login-user` é chamado com `password` vazio
- **THEN** o caso de uso falha com erro de validação correspondente

### Requirement: Credenciais inválidas com erro genérico

O caso de uso `login-user` SHALL lançar `DomainError('user.credentials.invalid', 401)` tanto quando o usuário não existir quanto quando a senha estiver incorreta — a mesma mensagem para os dois casos, para não vazar quais e-mails existem.

#### Scenario: Usuário não cadastrado

- **WHEN** `login-user` é chamado com um `email` que não existe no repositório
- **THEN** o caso de uso lança `DomainError('user.credentials.invalid', 401)`

#### Scenario: Senha incorreta

- **WHEN** `login-user` é chamado com `email` existente e `password` incorreto
- **THEN** `CryptoProvider.comparePassword` retorna `false`
- **AND** o caso de uso lança `DomainError('user.credentials.invalid', 401)` — a mesma mensagem usada quando o usuário não existe

### Requirement: Cobertura por testes unitários

O caso de uso `login-user` SHALL ter cobertura de 100% por testes unitários reaproveitando `FakeUserRepository` e `FakeCryptoProvider`, com cenários mínimos: login válido devolvendo `{ id, name, email }` sem `password`, e-mail inexistente, senha incorreta, e-mail vazio, e-mail inválido, senha vazia.

#### Scenario: Cobertura mínima

- **WHEN** os testes unitários do caso de uso são executados
- **THEN** os cenários acima estão presentes
- **AND** a cobertura do caso de uso é 100%

