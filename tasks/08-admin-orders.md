# Stage 08 - Admin/Manager: Sales/Orders Control (status workflow)

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
- Any order status update must also update matching Markdown + vector record.

## Objective
Allow ADMIN/MANAGER to manage orders and delivery statuses.

## Task checklist
### Backend
- [ ] `GET /admin/orders` (ADMIN/MANAGER):
  - filters by status, date, customer
- [ ] `PUT /admin/orders/:id/status` (ADMIN/MANAGER):
  - validate status transitions (simple v1 rules)
  - register audit
  - after relational success: regenerate order Markdown and update vector
  - pt-BR messages
- [ ] Ensure `DELIVERED` blocks customer cancellation.

### Frontend
- [ ] "Pedidos" screen (admin/manager):
  - listing with filters and search
  - order details (items, address snapshot)
  - update status via dropdown + save
- [ ] pt-BR feedback.

## Acceptance criteria
- [ ] Admin/Manager can list and update orders.
- [ ] Audit is created for changes.
- [ ] Status updates sync relational + vector in Supabase.
- [ ] Customer cannot cancel delivered order.

## Suggested commit
- `feat(admin-orders): order and status management (pt-BR)`
