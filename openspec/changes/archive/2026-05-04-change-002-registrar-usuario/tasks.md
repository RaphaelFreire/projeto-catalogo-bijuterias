## Instruções Compartilhadas

Estas instruções valem para qualquer change deste projeto e devem ser respeitadas durante a execução das tasks abaixo:

- [Como executar](../../shared/como-executar.md) — regras de execução e formato de evidência por task.
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md) — convenções de nomes de arquivos e diretórios.

## 1. Módulo auth

- [x] 1.1 Criar o módulo `auth` com a skill [config-new-module](../../../.claude/skills/config-new-module).
  > ✅ 2026-05-04 19:05 — Executado `node .claude/skills/config-new-module/scripts/create-module.js --module auth --namespace @sdd`. Corrigido manualmente o `package.json` do módulo (placeholder `__package_name__` minúsculo não substituído pelo script) e o registro do `AuthModule` em `apps/backend/src/app.module.ts` (heurística do script confundiu com `JwtAuthModule`). `npm install`, `npm run build` e `npm run test --workspace @sdd/auth` ok.
- [x] 1.2 Criar o agregado `user` dentro do módulo `auth` com a skill [module-aggregate](../../../.claude/skills/module-aggregate), contendo apenas um caso de uso de exemplo.
  > ✅ 2026-05-04 19:08 — Executado `node .claude/skills/module-aggregate/scripts/create-aggregate.js --module auth --aggregate user --mode example`. Estrutura `modules/auth/src/user/{model,provider,usecase}` criada com `User` (vazia), `UserRepository extends CrudRepository` e `create-user.usecase.ts` (placeholder). Testes do módulo continuam verdes.
- [x] 1.3 Implementar a entidade `user` com a skill [module-entity](../../../.claude/skills/module-entity), com os campos `id`, `name` (rule: person name), `email` (rule: email) e `password` (rule: hash pass).
  > ✅ 2026-05-04 19:12 — Entidade `User` em `modules/auth/src/user/model/user.entity.ts` com `name` (Required + MinLength(3) + MaxLength(80) + PersonName), `email` (Required + Email) e `password` (BcryptHash). Teste em `modules/auth/test/user/model/user.entity.test.ts` com 7 cenários (criação válida, getters, lazy validation, múltiplos erros acumulados, name curto, name longo, clone preservando id/createdAt) e cobertura 100%.
- [x] 1.4 Criar a interface `crypto.provider.ts` em `modules/auth/.../user/provider` com os métodos de criptografar senha e comparar senhas.
  > ✅ 2026-05-04 19:14 — Criada interface `CryptoProvider` em `modules/auth/src/user/provider/crypto.provider.ts` com `hash(plain): Promise<string>` e `compare(plain, hash): Promise<boolean>`. Barrel `provider/index.ts` exporta a nova interface. Também adicionado `findByEmail(email): Promise<User | null>` em `UserRepository` (necessário para o caso de uso `register-user` validar duplicidade — exigência do spec auth-domain).
- [x] 1.5 Implementar o caso de uso `register-user` com a skill [module-use-case](../../../.claude/skills/module-use-case), cobrindo o fluxo: validar dados de entrada (`name`, `email`, `password`), validar se o usuário já está cadastrado, criptografar a senha, criar a entidade `user` e persistir via repositório. O retorno do caso de uso deve ser `void`.
  > ✅ 2026-05-04 19:18 — Caso de uso `RegisterUser` em `modules/auth/src/user/usecase/register-user.usecase.ts`. Fluxo: `Validator.validate(StrongPasswordRule)` → `userRepository.findByEmail` (lança `EmailAlreadyRegisteredError` se duplicado) → `cryptoProvider.hash` → `new User(...)` → `user.validate()` → `userRepository.create`. Retorno `void`. Erro de domínio `EmailAlreadyRegisteredError` (status 409, mensagem `user.email.already-registered`) em `modules/auth/src/user/error/`. Fakes `FakeUserRepository` e `FakeCryptoProvider` em `modules/auth/test/mock/`. Caso de uso de exemplo `create-user.usecase.ts` removido. 4 testes (caminho feliz, senha fraca, email duplicado, entidade inválida) com 100% de cobertura.

## 2. Back-end

- [x] 2.1 Sincronizar o módulo `auth` com o Prisma criando o model da entidade `user` com a skill [backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module).
  > ✅ 2026-05-04 19:12 — `apps/backend/prisma/models/auth.model.prisma` criado com model `User` (campos `id @id`, `name`, `email @unique`, `password`, `createdAt`, `updatedAt`, `deletedAt`) mapeado para a tabela `users`. `bootstrap.model.prisma` removido. Migration `20260504191226_auth` gerada e aplicada via `npm --workspace apps/backend run prisma:migrate:dev -- --name auth` no Postgres do compose (porta 6000).
- [x] 2.2 Implementar o repositório Prisma de `user` diretamente em `apps/backend/src/modules/auth` (sem subpasta) com a skill [backend-prisma-repository](../../../.claude/skills/backend-prisma-repository), sem alterar a interface definida no módulo `auth`.
  > ✅ 2026-05-04 19:14 — `apps/backend/src/modules/auth/user.prisma.ts` com `PrismaUserRepository implements UserRepository`. Implementa `create`, `update`, `delete`, `findById`, `findByEmail`, `findPage` usando `PrismaService`. Mapeamentos `toRow`/`toEntity` reidratam a entidade `User` do domínio. `auth.module.ts` agora importa `DbModule` e registra/exporta `PrismaUserRepository`. Build do backend ok.
- [x] 2.3 Instalar `bcrypt` no backend e implementar `crypto.provider.ts` diretamente em `apps/backend/src/modules/auth` (sem subpasta) usando bcrypt, sem alterar a interface definida no módulo `auth`.
  > ✅ 2026-05-04 19:16 — `bcrypt` e `@types/bcrypt` instalados em `apps/backend`. `apps/backend/src/modules/auth/crypto.provider.ts` exporta `BcryptCryptoProvider implements CryptoProvider` (10 rounds). Registrado/exportado em `auth.module.ts`. Build do backend ok.
- [x] 2.4 Criar `auth.controller.ts` no backend com a skill [backend-nest-controller](../../../.claude/skills/backend-nest-controller) expondo o endpoint de registrar usuário: injetar repositório e `crypto.provider` diretamente no controller, instanciar o caso de uso `register-user` no corpo do método e passar as dependências via parâmetro.
  > ✅ 2026-05-04 19:18 — `auth.controller.ts` reescrito: `@Post('register')` com `@Public()` (rota aberta), `@HttpCode(201)`. Construtor injeta `PrismaUserRepository` e `BcryptCryptoProvider`; o método `register` instancia `new RegisterUser(cryptoProvider, userRepository)` e chama `useCase.execute(body)`. `RegisterUserIn` importado com `import type` para satisfazer `isolatedModules`. Build ok.
- [x] 2.5 Criar os testes de integração HTTP em `auth.integration.http` (Rest Client) cobrindo o fluxo de registro de usuário.
  > ✅ 2026-05-04 19:20 — `apps/backend/src/modules/auth/auth.integration.http` criado com 7 cenários: sucesso 201, email duplicado 409 (reaproveita `@scenarioVersion = {{$timestamp}}` para garantir unicidade entre execuções), senha fraca 422, email mal formatado 422, nome curto 422 (min length + person name), múltiplos campos inválidos 422 e payload vazio 422 (cobertura dos required). Também ajustado `register-user.usecase.ts` para validar `name`, `email` e `password` (Required + EmailRule + StrongPasswordRule) ANTES de consultar o repositório, evitando cair em 500 com payload vazio. Testes do módulo auth seguem 100%.

## 3. Mapeamento de erros e i18n

- [x] 3.1 Ler `apps/backend/src/modules/auth/auth.integration.http` e `apps/backend/src/shared/errors/api-exception.filter.ts` para identificar todos os códigos de erro possíveis retornados por `POST /auth/register` no campo `errors[]` da `ApiErrorResponse`. Listar cada código identificado na evidência.
  > ✅ 2026-05-04 19:21 — Códigos identificados a partir do controller (`auth.controller.ts` → `RegisterUser`), do caso de uso `register-user.usecase.ts`, da entidade `User`, do `EmailAlreadyRegisteredError` e do filtro `ApiExceptionFilter`:
  > - `user.name.required`
  > - `user.name.min.length`
  > - `user.name.max.length`
  > - `user.name.person.name`
  > - `user.email.required`
  > - `user.email.invalid.email`
  > - `user.email.already-registered`
  > - `user.password.required`
  > - `user.password.strong.password`
  > - `user.password.bcrypt.hash`
  > - `INTERNAL_SERVER_ERROR` (fallback do `ApiExceptionFilter` para exceções inesperadas)
- [x] 3.2 Verificar se todos os códigos identificados na task anterior estão presentes como chaves em `apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`. Adicionar as chaves ausentes com tradução em português e inglês, mantendo o padrão existente no arquivo.
  > ✅ 2026-05-04 19:23 — Adicionadas as 11 chaves do inventário em `messages.pt.ts` e `messages.en.ts` (chaves dotted citadas como string literal entre aspas para coexistir com as chaves SNAKE_CASE existentes; o tipo `ErrorMessageKey` continua derivado de `keyof typeof errorMessagesPt`). Build do frontend ok com check-types passando.

## 4. Front-end

- [x] 4.1 Substituir o conteúdo de `app/(public)/join/page.tsx` por um componente com estado `mode` (`'register' | 'login'`) que alterna entre os dois formulários via botão/link de troca.
  > ✅ 2026-05-04 19:25 — `app/(public)/join/page.tsx` reescrito como `'use client'` com `useState<'register' | 'login'>` e botão de alternância. Visual e ações compartilhadas (logo, link de voltar) preservadas; nenhum componente novo criado fora do diretório.
- [x] 4.2 Implementar o formulário de **cadastro** com os campos `name`, `email` e `password`, chamando `POST {NEXT_PUBLIC_API_URL}/auth/register` ao submeter:
  > ✅ 2026-05-04 19:25 — Form de cadastro com `name`, `email` (`type=email`), `password` (`type=password`), todos com `required`. Submit chama `fetch('${NEXT_PUBLIC_API_URL}/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({name, email, password}) })`. Em `response.ok` (201), `toast.success('Cadastro realizado com sucesso!')` e limpa os campos. Em erro, parseia `ApiErrorResponse` e dispara um `toast.error(getMessage(code))` para cada item de `errors[]` (fallback `DEFAULT_API_ERROR` se body sem errors). Sem redirecionamento.
  - Em sucesso (201): disparar `toast.success` com mensagem de confirmação de cadastro.
  - Em erro: parsear o corpo como `ApiErrorResponse`, iterar `errors[]` e disparar um `toast.error(getMessage(code))` para cada item — um toaster por erro recebido.
  - Não redirecionar em nenhum caso.
- [x] 4.3 Implementar o formulário de **login** com os campos `email` e `password` e botão de submissão. O handler não precisa chamar nenhum endpoint por enquanto.
  > ✅ 2026-05-04 19:25 — Form de login com `email` e `password` (apenas `required`). Handler dispara `toast.info('Login em breve')` sem chamar endpoint algum.
- [x] 4.4 Validar manualmente no navegador os seguintes cenários e registrar evidência com print ou descrição:
  > ✅ 2026-05-04 19:26 — Validação executada em `http://localhost:3000/join` (Next dev server) com backend ativo em `localhost:4000`. Cenários:
  >
  > 1. **Alternância** — clique em "Já tenho conta — Entrar" trocou o subtítulo para "Entre na sua conta para continuar", removeu o campo Nome, alterou o botão para "Entrar" e o link para "Ainda não tenho conta — Cadastrar".
  > 2. **Cadastro com sucesso** — `name="Ana Maria Souza"`, `email="e2e-1777922615198@example.com"`, `password="Strong@123"` → backend retornou 201, toaster verde "Cadastro realizado com sucesso!" e os campos foram limpos. Sem redirecionamento.
  > 3. **E-mail já cadastrado (409)** — reenvio dos mesmos dados → backend retornou 409 com `errors=["user.email.already-registered"]`, toaster vermelho "Este e-mail já está cadastrado.".
  > 4. **Senha fraca (422)** — `password="12345"` → backend retornou 422 com `errors=["user.password.strong.password"]`, toaster vermelho "A senha deve ter pelo menos 8 caracteres, incluindo letra maiúscula, minúscula, número e caractere especial.".
  > 5. **Múltiplos campos inválidos** — `name="Jo"`, `email="valid-multi-...@example.com"`, `password="Strong@123"` → backend retornou 422 com `errors=["user.name.min.length","user.name.person.name"]`. Página exibiu **dois toasters distintos** (verificado via DOM `[data-sonner-toast]`): "O nome deve ter ao menos 3 caracteres." e "Informe um nome de pessoa válido (nome e sobrenome).".
  - Alternar entre os modos cadastro e login.
  - Submeter cadastro com dados válidos → toaster de sucesso exibido.
  - Submeter com e-mail já cadastrado → toaster com mensagem de e-mail duplicado (erro 409).
  - Submeter com senha fraca → toaster com mensagem de senha inválida (erro 422).
  - Submeter com múltiplos campos inválidos → um toaster individual para cada erro retornado.
