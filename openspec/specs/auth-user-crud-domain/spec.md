# auth-user-crud-domain Specification

## Purpose
TBD - created by archiving change change-004-cadastro-usuario. Update Purpose after archive.
## Requirements
### Requirement: Caso de uso `save-user` (criar/atualizar)

O agregado `user` do módulo `auth` SHALL implementar o caso de uso `save-user` que cobre **criação e atualização** de usuário, retornando `void`. A decisão entre criar e atualizar SHALL ser baseada em `UserRepository.findById`: se `id` for fornecido na entrada e `findById` retornar um usuário, executa atualização; caso contrário (sem `id` ou usuário não encontrado), executa criação usando o `id` recebido (se fornecido) ou gerando um novo. `save-user` SHALL ser distinto de `register-user` (não fundir nem substituir).

#### Scenario: Criação sem `id`

- **WHEN** `save-user` é chamado sem `id`
- **THEN** uma nova entidade `user` é criada com `id` gerado e persistida via repositório

#### Scenario: Criação com `id` enviado e usuário inexistente

- **WHEN** `save-user` é chamado com um `id` que não existe no repositório
- **THEN** uma nova entidade é criada com o `id` recebido e persistida

#### Scenario: Atualização

- **WHEN** `save-user` é chamado com `id` existente
- **THEN** o caso de uso atualiza os campos do usuário e persiste via repositório

#### Scenario: `register-user` permanece intacto

- **WHEN** o módulo `auth` é inspecionado após esta change
- **THEN** `register-user` continua existindo como caso de uso distinto e não foi modificado

### Requirement: `save-user` preserva senha em edição sem `password`

O caso de uso `save-user` SHALL, em **atualização**, manter o `passwordHash` atual quando o `password` da entrada for ausente ou vazio — não re-hashear nem sobrescrever.

#### Scenario: Edição mantendo senha

- **WHEN** `save-user` é chamado em modo atualização com `password` ausente ou vazio
- **THEN** o `passwordHash` no repositório permanece inalterado
- **AND** `CryptoProvider.hashPassword` não é chamado

#### Scenario: Edição trocando senha

- **WHEN** `save-user` é chamado em modo atualização com `password` preenchido
- **THEN** `CryptoProvider.hashPassword` é chamado
- **AND** o novo hash substitui o anterior no repositório

### Requirement: Caso de uso `delete-user`

O agregado `user` do módulo `auth` SHALL implementar o caso de uso `delete-user` que recebe um `id` e remove o usuário correspondente do repositório, retornando `void`.

#### Scenario: Exclusão de usuário existente

- **WHEN** `delete-user` é chamado com `id` existente
- **THEN** o usuário é removido do repositório

#### Scenario: Exclusão de usuário inexistente

- **WHEN** `delete-user` é chamado com `id` que não existe
- **THEN** o caso de uso falha com erro de domínio correspondente (ex.: `user.not_found`)
- **AND** nada é alterado no repositório

### Requirement: Cobertura por testes unitários

Os casos de uso `save-user` e `delete-user` SHALL ter cobertura por testes unitários reaproveitando `FakeUserRepository` e `FakeCryptoProvider`. Os testes SHALL cobrir, no mínimo: criação sem id, criação com id, atualização básica, atualização sem `password` (mantendo hash), atualização trocando `password`, exclusão de usuário existente, exclusão de usuário inexistente.

#### Scenario: Cobertura mínima dos cenários

- **WHEN** os testes unitários dos dois casos de uso são executados
- **THEN** os cenários listados acima estão presentes

### Requirement: Casos de uso de comando retornam `void`

Os casos de uso de comando (`save-user`, `delete-user`) SHALL retornar `void`. Consultas (listagens, busca por id) NÃO PODEM virar caso de uso — ficam direto no controller chamando o repositório.

#### Scenario: Retorno void

- **WHEN** `save-user` ou `delete-user` é executado com sucesso
- **THEN** o retorno é `void`

#### Scenario: Sem casos de uso de consulta

- **WHEN** o módulo `auth` é inspecionado após esta change
- **THEN** não existem casos de uso de listagem ou de busca por id criados nesta change
