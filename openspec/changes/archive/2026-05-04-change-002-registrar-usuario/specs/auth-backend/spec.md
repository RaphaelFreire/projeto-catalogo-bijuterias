## ADDED Requirements

### Requirement: Model Prisma de `user`

O backend SHALL incluir o model Prisma de `user` em `apps/backend/prisma/models/auth.model.prisma`, sincronizado com a entidade `user` do módulo `auth`, com migration incremental aplicada.

#### Scenario: Model sincronizado com a entidade

- **WHEN** o módulo `auth` é sincronizado com o Prisma do backend
- **THEN** existe `apps/backend/prisma/models/auth.model.prisma` com o model `user`
- **AND** uma migration nomeada por módulo é gerada e aplicada

### Requirement: Repositório Prisma de `user`

O backend SHALL incluir uma implementação Prisma do repositório de `user` diretamente em `apps/backend/src/modules/auth` (sem subpasta), respeitando a interface definida no módulo `auth`.

#### Scenario: Repositório implementa contrato estável

- **WHEN** o repositório Prisma é construído
- **THEN** ele fica em `apps/backend/src/modules/auth/<arquivo>.prisma.ts`
- **AND** implementa a interface do módulo `auth` sem alterá-la
- **AND** está registrado no módulo Nest com `DbModule` e `PrismaService`

### Requirement: Provider bcrypt para criptografia

O backend SHALL implementar `crypto.provider.ts` diretamente em `apps/backend/src/modules/auth` (sem subpasta) usando a biblioteca `bcrypt`, respeitando a interface definida no módulo `auth`.

#### Scenario: Provider implementa contrato com bcrypt

- **WHEN** o provider de criptografia é construído
- **THEN** ele usa `bcrypt` para gerar hash e comparar senhas
- **AND** respeita a interface `crypto.provider` do módulo `auth` sem alterá-la

#### Scenario: Senhas armazenadas estão criptografadas

- **WHEN** um usuário é registrado com sucesso via `POST /auth/register`
- **THEN** o registro persistido no banco contém o hash da senha gerado por bcrypt, não o texto puro

### Requirement: Endpoint HTTP `POST /auth/register`

O backend SHALL expor `POST /auth/register` em `auth.controller.ts`, aceitando `{ name, email, password }`, retornando `201` sem corpo em sucesso e `ApiErrorResponse` em erro. O caso de uso `register-user` SHALL ser instanciado no corpo do método, recebendo o repositório e o `crypto.provider` injetados no controller via parâmetro.

#### Scenario: Registro bem-sucedido

- **WHEN** uma requisição `POST /auth/register` chega com `{ name, email, password }` válidos para um e-mail novo
- **THEN** o backend responde com status `201` sem corpo
- **AND** o usuário é persistido com a senha criptografada

#### Scenario: Erro de e-mail duplicado

- **WHEN** uma requisição `POST /auth/register` chega com um `email` já cadastrado
- **THEN** o backend responde com status `409`
- **AND** o corpo segue o formato `ApiErrorResponse` com `errors[]` contendo a chave do erro de duplicidade

#### Scenario: Erro de validação de entrada

- **WHEN** uma requisição `POST /auth/register` chega com um ou mais campos inválidos (ex.: senha fraca, e-mail mal formatado)
- **THEN** o backend responde com status `422`
- **AND** o corpo segue `ApiErrorResponse` com `errors[]` contendo uma chave por campo inválido

#### Scenario: Caso de uso instanciado no corpo do método

- **WHEN** o handler do endpoint é executado
- **THEN** uma nova instância de `RegisterUserUseCase` é criada dentro do método
- **AND** as dependências (repositório e `crypto.provider`) são passadas como parâmetro a partir das injeções do controller

### Requirement: Testes de integração HTTP do registro

O backend SHALL incluir testes de integração HTTP em `apps/backend/src/modules/auth/auth.integration.http` (formato Rest Client) cobrindo o fluxo de registro de usuário.

#### Scenario: Cobertura mínima dos cenários de registro

- **WHEN** os testes em `auth.integration.http` são inspecionados
- **THEN** existe pelo menos um cenário de sucesso `201`
- **AND** existe pelo menos um cenário de e-mail duplicado
- **AND** existe pelo menos um cenário de dados inválidos
