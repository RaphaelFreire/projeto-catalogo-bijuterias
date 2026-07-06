## Instruções Compartilhadas

Esta change segue as instruções gerais comuns a todas as changes do projeto:

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Context

A change-004 entregou o template de CRUD usando `user` no módulo `auth`. Esta change replica esse template em outro módulo (`catalog`) para o agregado `product`, validando que o padrão (`save-X`/`delete-X` no domínio + controller com mapeamento explícito + listagem/formulário compartilhado no front) é generalizável para qualquer cadastro administrativo.

Premissas e contratos herdados:

- Módulo `catalog` já existe em `modules/catalog`, sem agregados ainda.
- Backend NestJS tem `JwtAuthGuard` global + `@Public()`; somente `/auth/register` e `/auth/login` são públicos.
- Backend tem `ApiExceptionFilter` global convertendo `DomainError` em `ApiErrorResponse`.
- Pacote compartilhado expõe regras de validação: `RequiredRule`, `MinLengthRule`, `MaxLengthRule`, `MinValueRule`, `PrecisionRule`, `InRule`.
- Frontend já tem `AuthContext`/`AuthGuard`, `form-section-layout`, `delete-confirmation-dialog` e padrão de listagem da change-004.
- Sidebar é estendida via lista de itens.

## Goals / Non-Goals

**Goals:**

- Entregar o agregado `product` completo (entidade validada, contrato de repositório, `save-product`, `delete-product`, testes).
- Expor CRUD HTTP autenticado em `/products` com mapeamento de leitura para objeto simples.
- Replicar o padrão visual da change-004 com três seções no formulário, refletindo a natureza do produto (dados básicos, preço/status, disponibilidade).
- Validar `status` como enum estrito (`active|inactive|draft`) em domínio, banco e UI.
- Manter o template generalizável para próximos cadastros do projeto.

**Non-Goals:**

- Categorias, estoque, variações, fotos do produto — não nesta change.
- Validação automatizada de UI (preview/Chrome).
- DTOs de entrada — o projeto não usa.
- Validações cross-campo complexas (ex.: pré-venda só permitido se status `draft`) — booleanos são independentes.
- Roles ou permissões finas. Acesso é binário (autenticado ou não).

## Decisions

### Decisão 1: Booleanos independentes com default `false` na criação

`availableOnline`, `featured` e `allowsPreOrder` são booleanos independentes; quando ausentes na criação, assumem `false`.

**Por quê:** Mantém o agregado simples e previsível. Combinações específicas (ex.: featured + pré-venda) são regras de produto, não regras de domínio nesta change.

### Decisão 2: `description` opcional persistido como `null`

Quando ausente, `description` é persistido como `null` (não como string vazia).

**Por quê:** `null` distingue ausência intencional de string vazia, e Prisma já lida com `null` em colunas opcionais sem ginástica adicional.

### Decisão 3: `status` é enum tipado no agregado

`status` é `'active' | 'inactive' | 'draft'`, validado por `InRule` do pacote compartilhado, e exposto como tipo (alias) no agregado para reuso em casos de uso, controller e UI.

**Por quê:** Tipo dedicado evita strings mágicas espalhadas. A regra `in` valida em domínio; o backend rejeita valores fora do enum no `422`. UI usa `select` com as três opções.

### Decisão 4: `price` numérico, não-negativo, precisão 2

`price` é `number`, com `MinValueRule(0)` e `PrecisionRule(2)`.

**Por quê:** Padrão monetário comum (duas casas decimais). Não-negativo é regra mínima — promoções e descontos são features futuras.

**Trade-off:** `number` em JS tem precisão limitada para valores muito altos. Aceito para a maioria dos catálogos; em uma change futura, migrar para `Decimal` se necessário.

### Decisão 5: `save-product` decide cria/atualiza por `findById` (mesmo padrão da change-004)

Se `id` vier e `findById` retornar registro, atualiza. Senão cria com o `id` recebido ou gerando um novo.

**Por quê:** Padrão estabelecido na change-004. Manter consistência reduz custo cognitivo.

### Decisão 6: `delete-product` exige existência

`delete-product` lança `DomainError("product.not_found", 404)` quando `findById` não encontra o registro.

**Por quê:** Distinção entre 404 (não existe) e 200 (excluído) é útil para UI. Diferente do login (onde uma mensagem genérica protege contra enumeration), aqui não há risco de privacidade.

### Decisão 7: Casos de uso de comando retornam `void`; consultas direto no controller

Mesmo padrão da change-004.

**Por quê:** Consistência. Listagem e `get-by-id` não têm regra de negócio — leitura pura cabe no controller.

### Decisão 8: Mapeamento explícito de todos os campos públicos no controller

Toda resposta de leitura constrói o objeto manualmente: `{ id, name, description, price, status, availableOnline, featured, allowsPreOrder }`. Sem `toJSON()`, sem DTO.

**Por quê:** Mesmo motivo da change-004 — `JSON.stringify` ignora getters de prototype na entidade.

### Decisão 9: Formulário com três seções

Seção 1 "Dados básicos" (nome, descrição), Seção 2 "Preço e status" (preço, select de status), Seção 3 "Disponibilidade" (três checkboxes).

**Por quê:** Agrupa campos por afinidade semântica e replica o padrão visual da change-004. Status como `select` deixa o enum explícito para o usuário; checkboxes deixam claro que os booleanos são independentes.

### Decisão 10: Sem verificação automatizada de UI nesta change

Não acionar `mcp__Claude_Preview` nem `mcp__Claude_in_Chrome`. Validações automatizadas param no backend (unit + Rest Client).

**Por quê:** Decisão explícita do usuário (registrada na spec original), mesma da change-004.

### Decisão 11: Três capabilities — domínio, backend, frontend

`catalog-product-domain`, `catalog-product-backend`, `catalog-product-frontend`.

**Por quê:** Mesma estrutura da change-004. Cada camada com requisitos verificáveis distintos; reaproveita o padrão para próximos cadastros.

## Risks / Trade-offs

- **`price` como `number`** → Mitigação: aceito para valores comerciais comuns; futura migração para `Decimal` é trivial se preciso.
- **`status` como string em vez de enum no Prisma** → Mitigação: o agregado define o tipo; no Prisma pode ser `String` com check externo ou `Enum` nativo. Decisão fica para a sincronização do Prisma; o domínio já garante via `InRule`.
- **Campos booleanos crescendo no futuro** → Mitigação: aceito; quando passar de 3–4, vale considerar agrupar (ex.: `flags: { ... }`). Hoje, três campos diretos é mais legível.
- **Listagem sem filtros/ordenação** → Mitigação: nesta change, paginação simples basta. Filtros (por status, por nome) ficam para change futura.
- **Sem testes automatizados de UI pode mascarar regressões visuais** → Mitigação: usuário valida manualmente; backend coberto por unit + HTTP.
- **i18n crescendo** → Mitigação: a task explicita reaproveitar chaves; eventual consolidação fica para revisão futura.

## Migration Plan

Não há sistema em produção. Entrega incremental:

1. Domínio: criar agregado, entidade `Product` com regras, contrato de repositório, `save-product`, `delete-product`, testes unitários com fakes.
2. Backend: sincronizar Prisma + migration, repositório Prisma, `ProductController` com CRUD autenticado e mapeamento explícito, `product.integration.http`.
3. Frontend: i18n complementar (`product.not_found`, `product.status.*`, validações), item "Produtos" no menu, listagem paginada, formulário compartilhado em três seções, integração de ações (editar/excluir).
4. Rodar `npx tsc --noEmit` no frontend e sinalizar ao usuário para conferência manual.

Rollback: descartar a branch.

## Open Questions

- Nenhuma. A spec original fixa as regras de validação, os defaults dos booleanos, o tratamento de `description` ausente e a estratégia de mapeamento no controller.
