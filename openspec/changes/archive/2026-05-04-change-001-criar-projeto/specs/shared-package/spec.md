## ADDED Requirements

### Requirement: Pacote compartilhado base sob `@sdd`

O monorepo SHALL incluir um pacote compartilhado, sob o namespace `@sdd`, contendo contratos reutilizáveis, classes base, erros de domínio, casos de uso base e validações reaproveitadas por backend, frontend e módulos de negócio.

#### Scenario: Pacote compartilhado disponível para todos os consumidores

- **WHEN** a skill `config-package-shared` é executada com o namespace `@sdd`
- **THEN** o pacote compartilhado existe sob `@sdd` no workspace
- **AND** backend, frontend e módulos podem importar contratos, classes base, erros de domínio, casos de uso e validações a partir dele

### Requirement: Conteúdo mínimo do pacote compartilhado

O pacote compartilhado SHALL concentrar pelo menos: contratos de entrada/saída de casos de uso, classes base de entidade e caso de uso, erros de domínio, e regras de validação reutilizáveis.

#### Scenario: Categorias de conteúdo presentes

- **WHEN** o pacote compartilhado é inspecionado
- **THEN** ele expõe contratos reutilizáveis, classes base, erros de domínio, casos de uso base e regras de validação compartilhadas
