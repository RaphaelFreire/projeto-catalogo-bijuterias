# backend-foundation Specification

## Purpose
TBD - created by archiving change change-001-criar-projeto. Update Purpose after archive.
## Requirements
### Requirement: Tratamento centralizado de erros no backend

O backend NestJS SHALL ter tratamento centralizado de erros, convertendo erros de domínio e exceções em respostas HTTP padronizadas (formato `ApiErrorResponse`).

#### Scenario: Erro de domínio retorna resposta padronizada

- **WHEN** um caso de uso do backend lança um erro de domínio
- **THEN** o tratamento centralizado converte o erro em uma resposta HTTP no formato `ApiErrorResponse`
- **AND** o status HTTP corresponde à natureza do erro

#### Scenario: Exceção não tratada retorna resposta padronizada

- **WHEN** uma exceção inesperada ocorre durante o atendimento de uma requisição
- **THEN** o tratamento centralizado retorna uma resposta HTTP no formato `ApiErrorResponse`
- **AND** detalhes sensíveis não são expostos ao cliente

### Requirement: Base de autenticação JWT

O backend NestJS SHALL fornecer a infraestrutura de autenticação baseada em JWT, incluindo decorators utilitários e infraestrutura comum para endpoints protegidos.

#### Scenario: Endpoint protegido por JWT

- **WHEN** um endpoint do backend é marcado como protegido com os decorators fornecidos
- **THEN** apenas requisições com JWT válido conseguem acessá-lo
- **AND** requisições sem JWT ou com JWT inválido recebem resposta padronizada de não autorizado

#### Scenario: Endpoint público

- **WHEN** um endpoint é marcado como público pelos decorators fornecidos
- **THEN** ele responde sem exigir JWT

### Requirement: Decorators utilitários para endpoints

O backend SHALL expor decorators utilitários reaproveitáveis para marcar endpoints como protegidos ou públicos e para acessar o usuário autenticado.

#### Scenario: Decorator de usuário autenticado

- **WHEN** um handler de endpoint protegido usa o decorator de usuário autenticado
- **THEN** o handler recebe os dados do usuário extraídos do JWT

