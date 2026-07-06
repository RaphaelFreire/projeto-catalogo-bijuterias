# frontend-foundation Specification

## Purpose
TBD - created by archiving change change-001-criar-projeto. Update Purpose after archive.
## Requirements
### Requirement: Estrutura compartilhada `shared/` no frontend

O frontend Next.js SHALL ter uma pasta `shared/` configurada para concentrar utilitários, contratos e componentes reaproveitáveis pelos módulos de negócio.

#### Scenario: Pasta shared disponível

- **WHEN** a skill `frontend-next-config` é executada
- **THEN** o frontend possui a pasta `shared/` pronta para receber utilitários, contratos e componentes compartilhados

### Requirement: Grupos de rotas Next.js público e privado

O frontend SHALL organizar suas rotas em grupos `(public)` e `(private)` no Next.js, permitindo que páginas públicas e privadas tenham layouts independentes.

#### Scenario: Rotas separadas por grupo

- **WHEN** o frontend é inicializado
- **THEN** existem os grupos de rotas `(public)` e `(private)`
- **AND** páginas privadas são organizadas dentro do grupo `(private)`
- **AND** páginas públicas são organizadas dentro do grupo `(public)`

### Requirement: Sidebar de navegação na área privada

O grupo de rotas `(private)` SHALL incluir uma sidebar de navegação funcional que permita transitar entre páginas privadas.

#### Scenario: Sidebar funcional na área privada

- **WHEN** o usuário acessa qualquer página dentro de `(private)`
- **THEN** uma sidebar de navegação é renderizada
- **AND** a sidebar permite navegar entre as páginas privadas existentes

### Requirement: Integração com o padrão de erros do backend

O frontend SHALL ser compatível com o padrão `ApiErrorResponse` definido pelo backend, permitindo consumir erros de forma padronizada.

#### Scenario: Frontend interpreta erros padronizados

- **WHEN** o frontend recebe uma resposta no formato `ApiErrorResponse` do backend
- **THEN** ele consegue interpretar a estrutura sem código adicional ad-hoc

### Requirement: Inicialização sem erros

O frontend SHALL inicializar sem erros após a configuração da estrutura compartilhada e dos grupos de rotas.

#### Scenario: Frontend sobe limpo

- **WHEN** o frontend é iniciado em ambiente de desenvolvimento após a configuração
- **THEN** o servidor sobe na porta 3000
- **AND** não há erros de build ou runtime durante a inicialização

