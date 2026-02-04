# SKILL — Banco Relacional PostgreSQL (migrations profissionais + modelagem)

## Objetivo
Modelar e evoluir o banco relacional PostgreSQL com **migrations seguras**, **constraints corretas**, **índices**, **integridade referencial** e boas práticas de performance.

---

## Princípios obrigatórios
1. **Migrations idempotentes e rastreáveis** (com ferramenta do projeto).
2. **Constraints primeiro**: PK, FK, UNIQUE, CHECK, NOT NULL.
3. **Timestamps padrão**: `created_at`, `updated_at` (com timezone quando aplicável).
4. **Modelagem para e-commerce**:
   - snapshots em `order_items` para preservar histórico
5. **Índices para consultas reais**:
   - `products(category)`, `orders(customer_user_id, created_at)`, etc.
6. **Transações** em operações críticas:
   - checkout: criar pedido + baixar estoque
   - cancelamento: reverter estoque + status
7. **Evitar over-normalization**: equilíbrio entre integridade e praticidade.
8. **Sem exclusão destrutiva sem estratégia**: preferir soft delete quando fizer sentido.

---

## Regras de migrations
- Nomear migrations com timestamp + descrição:
  - `20260204_create_users_table.sql`
- Ordem:
  1) criar tipos/enums
  2) criar tabelas
  3) constraints/FKs
  4) índices
  5) seeds (separado, quando aplicável)

### Exemplos de constraints importantes
- `cpf` UNIQUE para customer.
- `inventory.quantity >= 0` com CHECK.
- `purchase_price >= 0` e `sale_price >= 0`.
- FKs com `ON DELETE` definido conscientemente (geralmente RESTRICT).

---

## Padrões de tipos
- `uuid` como chave primária.
- `numeric(12,2)` para dinheiro (evitar float).
- `text` para descrições longas.
- `varchar` somente quando houver limitação real.
- `timestamptz` para datas.

---

## Índices recomendados (v1)
- `users(role)` (se filtrar por role)
- `customers_profile(cpf)` unique index já ajuda
- `products(category)`
- `products(name)` (opcional: `GIN` com trigram para busca textual futura)
- `orders(customer_user_id, created_at DESC)`
- `order_items(order_id)`
- `inventory(product_id)`

---

## Padrões de transação (checkout/cancel)
- Checkout:
  - bloquear linhas de estoque com `SELECT ... FOR UPDATE`
  - verificar quantidade
  - atualizar quantidade
  - inserir pedido e itens
- Cancelamento:
  - validar regra no app + reforçar consistência no DB
  - reverter estoque em transação
  - atualizar status

---

## Checklist de revisão antes do merge
- [ ] Migration roda do zero (banco limpo) sem erros
- [ ] Migration roda em banco já existente (upgrade) sem quebrar
- [ ] Constraints e índices presentes
- [ ] Queries principais usam índices (EXPLAIN se necessário)
- [ ] Tipos corretos para dinheiro/datas

---

## Referências de implementação (pasta /references)
Consulte `/references/postgres/` para exemplos de:
- schema base do e-commerce (users/products/orders)
- migrations com enums e constraints
