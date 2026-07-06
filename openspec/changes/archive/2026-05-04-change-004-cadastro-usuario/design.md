## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Context

As changes 001–003 entregaram a base do projeto e o módulo `auth` com cadastro inicial e login. Esta change agora entrega o **CRUD administrativo de usuários** dentro do mesmo módulo `auth`, sem mexer em `register-user` nem em `login-user`. O CRUD aqui é o template que outros cadastros administrativos vão imitar.

Premissas e contratos herdados:

- Módulo `auth` tem agregado `user`, `UserRepository` (com `findById`/`findByEmail`/listagens) e `CryptoProvider` (hash + compare).
- Backend NestJS já tem `JwtAuthGuard` global e decorator `@Public()` (só `/auth/register` e `/auth/login` são públicos hoje).
- Backend tem `ApiExceptionFilter` global convertendo `DomainError` em `ApiErrorResponse`.
- Frontend usa `fetch` nativo; `AuthContext`/`AuthGuard` cobrem o grupo `(private)`; já existem `form-section-layout` e `delete-confirmation-dialog` em `apps/frontend/src/shared/components/ui`.
- Sidebar de navegação (`app-sidebar-navigation.component.tsx`) é estendida via lista de itens.

## Goals / Non-Goals

**Goals:**

- Entregar `save-user` e `delete-user` no módulo `auth`, sem fundir com `register-user`.
- Expor CRUD HTTP autenticado em `/users` via `UserController` no backend, com leitura mapeada para objetos simples.
- Entregar listagem paginada, formulário compartilhado cria/edita com seções e fluxo de exclusão com confirmação no frontend.
- Servir de referência para próximos cadastros administrativos do projeto.

**Non-Goals:**

- Substituir/fundir `register-user` ou `login-user`.
- Validação automatizada de UI (preview/Chrome). Validação manual fica com o usuário.
- DTOs de entrada — o projeto não usa.
- Roles, permissões, níveis de acesso. Acesso é binário (autenticado ou não).
- Casos de uso para consultas. Consultas chamam o repositório direto.

## Decisions

### Decisão 1: `save-user` decide cria/atualiza por `findById`

A entrada pode trazer `id`. Se vier e `findById(id)` retornar um usuário, atualiza. Senão (sem `id` ou usuário não encontrado), cria com o `id` recebido ou gerando um novo.

**Por quê:** Padrão simples de upsert orientado pelo repositório. Cliente decide se manda `id` ou não; o caso de uso lida com ambos os caminhos sem ramificar a API.

**Trade-off:** Em criação com `id` enviado pelo cliente, o cliente determina o id — aceito porque o backend já valida o id como UUID válido na entidade.

### Decisão 2: Em edição sem `password`, manter hash atual

Se `password` vier ausente ou vazio em update, não re-hashea — mantém o `passwordHash` atual no banco.

**Por quê:** Confirmação/troca de senha é fluxo opcional na edição; forçar repassar a senha em toda atualização degrada UX. O frontend pode deixar o campo vazio para "não alterar".

### Decisão 3: Confirmação de senha apenas no frontend

Backend recebe só `password`. Frontend valida que `password === confirmation` antes de enviar.

**Por quê:** Confirmação é decoração de UX, não regra de negócio. Backend não precisa carregar essa validação.

### Decisão 4: Casos de uso de comando retornam `void`; consultas não viram caso de uso

`save-user` e `delete-user` retornam `void`. Listagem e `get-by-id` ficam direto no controller chamando o repositório.

**Por quê:** Consultas não têm regra de negócio digna de caso de uso — são leitura pura. Casos de uso de comando retornarem `void` mantém o padrão do projeto e evita serialização do agregado por engano.

### Decisão 5: Mapear leitura para objetos simples no controller

Entidades de domínio usam `protected readonly props` com getters de prototype, que `JSON.stringify` retorna `{}`. Por isso, **todo retorno de leitura** é construído explicitamente no controller: `return { id: user.id, name: user.name, email: user.email }`.

**Por quê:** É a forma mais simples e explícita de garantir serialização correta sem introduzir camada de DTOs/mapeadores. Está documentado nas observações da spec original.

**Alternativa considerada:** Adicionar `toJSON()` na entidade. Rejeitada por acoplar serialização ao domínio.

### Decisão 6: `UserController` autenticado, padrão `JwtAuthGuard` global

Sem `@Public()` no `user.controller.ts`. Todas as rotas exigem JWT.

**Por quê:** É o CRUD administrativo. O guard global cobre por padrão; basta não marcar como público.

### Decisão 7: Listagem paginada — backend devolve `{ items, total, page, pageSize }`

Padrão simples de paginação. Repositório expõe `findPage({ page, pageSize })`.

**Por quê:** Compatível com tabelas que já existem no projeto (a skill `module-repository` define `findPage`). Frontend renderiza com paginador simples.

### Decisão 8: Formulário compartilhado cria/edita via `form-section-layout`

Mesmo componente para criar e editar, organizado em seções "Dados básicos" e "Senha".

**Por quê:** Reduz duplicação, padroniza visual com outros cadastros futuros, permite que a seção "Senha" tenha comportamento idêntico nos dois modos (em edição, deixar vazio para manter).

### Decisão 9: Sem verificação automatizada de UI nesta change

Não acionar `mcp__Claude_Preview` nem `mcp__Claude_in_Chrome`. Validações automatizadas param na camada backend (unit + Rest Client). UI fica para conferência manual.

**Por quê:** Decisão explícita do usuário (registrada nas observações da spec original). Reduz fricção e respeita o estado das ferramentas neste momento do projeto.

### Decisão 10: Três capabilities — domínio, backend, frontend

`auth-user-crud-domain`, `auth-user-crud-backend`, `auth-user-crud-frontend`.

**Por quê:** Mesma estrutura das changes anteriores. Cada camada tem requisitos verificáveis distintos e pode ser referenciada/estendida por changes futuras de outros cadastros.

## Risks / Trade-offs

- **Cliente determinando `id` em criação** → Mitigação: validação de UUID na entidade; o frontend não envia `id` ao criar (apenas em edição), reduzindo o risco prático.
- **Senha vazia em edição pode confundir o usuário ("esqueci de digitar")** → Mitigação: rótulo do campo deixa claro "deixe em branco para manter"; confirmação do front exige que ambos os campos batam (vazio com vazio é válido).
- **Controller construindo objeto manualmente é boilerplate** → Mitigação: aceito; é o padrão do projeto e evita acoplamento de serialização ao domínio.
- **Sem testes automatizados de UI pode mascarar regressões visuais** → Mitigação: o usuário valida manualmente; cobertura automatizada do backend cobre a lógica.
- **i18n pode crescer sem controle** → Mitigação: a task explicita reaproveitar chaves existentes e listar as novas; revisões futuras podem consolidar.

## Migration Plan

Não há sistema em produção. Entrega incremental:

1. Implementar `save-user` (cria/atualiza com `findById`) e `delete-user` no domínio + testes unitários.
2. Backend: `user.controller.ts` com CRUD autenticado, mapeamento de leitura, e `user.integration.http` cobrindo CRUD e principais erros.
3. Frontend: i18n complementar, item de menu "Usuários", listagem paginada, formulário compartilhado, integração de ações (editar/excluir).
4. Rodar `npx tsc --noEmit` no frontend e sinalizar ao usuário para conferência manual.

Rollback: descartar a branch.

## Open Questions

- Nenhuma. A spec original fixa o comportamento de `save-user` (decisão por `findById`), o tratamento de senha em edição, a estratégia de mapeamento no controller e o escopo da validação manual.
