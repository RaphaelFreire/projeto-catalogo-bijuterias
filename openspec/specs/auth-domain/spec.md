# auth-domain Specification

## Purpose
TBD - created by archiving change change-002-registrar-usuario. Update Purpose after archive.
## Requirements
### Requirement: Módulo `auth` com agregado `user`

O sistema SHALL incluir o módulo de domínio `auth` em `modules/auth`, contendo o agregado `user` e ponto de extensão para casos de uso, repositórios e providers do agregado.

#### Scenario: Módulo auth criado com agregado user

- **WHEN** o módulo `auth` é criado e o agregado `user` é adicionado
- **THEN** existe a estrutura `modules/auth/.../user/{entity,provider,repository,use-case}` pronta para receber os artefatos do agregado

### Requirement: Entidade `user` com campos validados

O agregado `user` SHALL definir uma entidade com os campos `id`, `name`, `email` e `password`, validados pelas regras compartilhadas correspondentes (`person name`, `email`, `hash pass`).

#### Scenario: Entidade aceita dados válidos

- **WHEN** uma entidade `user` é instanciada com `name` (nome de pessoa válido), `email` (e-mail válido) e `password` (hash válido)
- **THEN** a entidade é criada sem lançar erros de validação

#### Scenario: Entidade rejeita dados inválidos

- **WHEN** uma entidade `user` é instanciada com `name`, `email` ou `password` inválidos
- **THEN** a criação falha com erros de domínio correspondentes a cada campo inválido

### Requirement: Contrato do repositório de `user`

O agregado `user` SHALL expor uma interface de repositório no módulo `auth` que defina, no mínimo, operações de busca por e-mail e persistência de uma nova entidade. Esta interface não pode ser alterada por implementações técnicas.

#### Scenario: Contrato estável do repositório

- **WHEN** uma implementação técnica do repositório é construída
- **THEN** ela respeita a interface definida em `modules/auth` sem modificá-la

### Requirement: Contrato `crypto.provider`

O agregado `user` SHALL expor uma interface `crypto.provider.ts` em `modules/auth/.../user/provider` com métodos para criptografar uma senha e comparar uma senha em texto puro com um hash. Esta interface não pode ser alterada por implementações técnicas.

#### Scenario: Contrato cobre criptografia e comparação

- **WHEN** o contrato `crypto.provider` é inspecionado
- **THEN** ele expõe operação para gerar hash a partir de uma senha em texto puro
- **AND** expõe operação para comparar uma senha em texto puro com um hash

### Requirement: Caso de uso `register-user`

O agregado `user` SHALL implementar o caso de uso `register-user` que valida a entrada (`name`, `email`, `password`), verifica se o usuário já está cadastrado, criptografa a senha via `crypto.provider`, cria a entidade `user` e persiste via repositório. O retorno do caso de uso SHALL ser `void`.

#### Scenario: Registro de usuário novo

- **WHEN** `register-user` é executado com `name`, `email` e `password` válidos para um e-mail ainda não cadastrado
- **THEN** o caso de uso criptografa a senha
- **AND** persiste a entidade `user` via repositório
- **AND** retorna `void`

#### Scenario: Registro com e-mail já cadastrado

- **WHEN** `register-user` é executado com um `email` já presente no repositório
- **THEN** o caso de uso falha com erro de domínio de e-mail duplicado
- **AND** nenhum dado é persistido

#### Scenario: Registro com dados inválidos

- **WHEN** `register-user` é executado com `name`, `email` ou `password` inválidos
- **THEN** o caso de uso falha com erros de domínio correspondentes a cada campo inválido
- **AND** nenhum dado é persistido

