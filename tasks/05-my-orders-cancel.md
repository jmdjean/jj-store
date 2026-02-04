# Stage 05 - My Orders + Cancellation (<= 3 days and not delivered)

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
- Every order change (including cancellation) must also update Markdown + vector record.

## Objective
Allow customer to view own orders and cancel when allowed.

## Task checklist
### Backend
- [ ] `GET /me/orders` (CUSTOMER):
  - paginated list sorted by date
- [ ] `GET /me/orders/:id` (CUSTOMER) (optional)
- [ ] `POST /me/orders/:id/cancel` (CUSTOMER):
  - allow if `status != DELIVERED` and `created_at` <= 3 days
  - set status to `CANCELED`
  - return stock (transaction)
  - register audit
  - after relational success: regenerate order Markdown and update vector embedding
  - pt-BR messages

### Frontend
- [ ] `/minhas-compras` screen:
  - list orders with status badges
  - show "Cancelar" only when allowed
- [ ] Details screen (optional v1) for order items.
- [ ] pt-BR messages (example: "Pedido cancelado com sucesso", "Prazo de cancelamento expirado").

## Acceptance criteria
- [ ] Cancellation rules are enforced.
- [ ] Stock is returned on cancellation.
- [ ] Cancellation also syncs Markdown + vector in Supabase.
- [ ] UI shows statuses and allows valid cancellation.

## Suggested commit
- `feat(my-orders): listing and cancellation with 3-day rule (pt-BR)`
