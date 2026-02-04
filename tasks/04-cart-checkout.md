# Stage 04 - Cart + Checkout (order creation and stock decrease)

# Global conventions (applies to all stages)

> **Language standard (mandatory):** all user-facing system language must be **Portuguese (Brazil) - pt-BR**,
> including: success/error messages, validations, API responses, UI labels/placeholders,
> user-facing logs (when applicable), and screen documentation.

## Delivery rules
- Implement **only** this stage scope.
- Keep backend layered architecture (routes/controllers -> services -> repositories).
- In frontend (Angular 21), keep areas/modules and **guards** by auth and role.
- Ensure **build/tests** pass (when available).
- At the end, create **1 commit** with a clear message.

## Role definitions
- `ADMIN`
- `MANAGER`
- `CUSTOMER`

## Order status standard (v1)
- `CREATED`, `PAID`, `PICKING`, `SHIPPED`, `DELIVERED`, `CANCELED`

## Data guideline (mandatory for all stages)
- Use **one single Supabase PostgreSQL database** (IPv4-compatible via Supabase pooler/connection string).
- The same database contains two logical layers:
  - relational (registrations and transactions)
  - vector for RAG (pgvector)
- Mandatory sync rule for **every create/update**:
  1) persist relational data successfully;
  2) generate canonical `.md` entity document;
  3) generate embedding and upsert vector record.

## Objective
Implement frontend cart and backend checkout (no payment gateway in v1).

## Task checklist
### Frontend
- [ ] `CartService` with localStorage persistence.
- [ ] `/carrinho` screen:
  - list items, change quantity, remove item
  - subtotal
- [ ] `/checkout` screen:
  - require login (redirect to login and return)
  - confirm profile address and finalize purchase
- [ ] pt-BR messages (example: "Quantidade indisponivel em estoque").

### Backend
- [ ] Create `orders` and `order_items` tables.
- [ ] Create vector table for order documents (`rag_documents` or equivalent) in same Supabase database.
- [ ] `POST /cart/checkout` (CUSTOMER):
  - input: items `{ productId, quantity }` + address (optional; default from profile snapshot)
  - validate stock and prices
  - create order + items
  - decrease stock (transaction)
  - after relational success: generate order Markdown + item details and save embedding in vector table
  - return pt-BR confirmation with `orderId`
- [ ] pt-BR error cases:
  - "Estoque insuficiente para o produto X"
  - "Produto nao encontrado"

## Acceptance criteria
- [ ] Checkout creates order and updates stock correctly.
- [ ] Created order also generates Markdown document and vector record in Supabase.
- [ ] Cart works and persists.
- [ ] Success/errors are in pt-BR.

## Suggested commit
- `feat(orders): cart and checkout with stock decrease (pt-BR)`
