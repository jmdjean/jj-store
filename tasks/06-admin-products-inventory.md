# Stage 06 - Admin/Manager: Product CRUD + Inventory

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
- Mandatory rule for each create/update/delete on product:
  1) persist relational change successfully;
  2) generate canonical product Markdown;
  3) upsert (or remove/deactivate) vector record.

## Objective
Allow ADMIN/MANAGER to create and edit products and inventory.

## Task checklist
### Backend
- [ ] Protected endpoints (ADMIN/MANAGER):
  - [ ] `GET /admin/products`
  - [ ] `POST /admin/products`
  - [ ] `PUT /admin/products/:id`
  - [ ] `DELETE /admin/products/:id` (optional v1)
- [ ] Rules:
  - [ ] validate prices, weight, quantity >= 0
  - [ ] optional image
- [ ] RAG sync:
  - [ ] on create/update, generate `.md` and update vector in Supabase
  - [ ] on delete, remove/deactivate related vector document
- [ ] Audit:
  - [ ] register create/update and acting user
- [ ] pt-BR messages for responses and errors.

### Frontend (Admin/Manager)
- [ ] Admin area with professional layout (sidebar/topbar).
- [ ] "Products" screen:
  - listing with search/filter
  - "Novo produto" button
- [ ] "Create/Edit Product" screen with:
  - name, description, category, quantity, weight, cost price, sale price, optional image
- [ ] pt-BR success/error feedback.

## Acceptance criteria
- [ ] CRUD works and is RBAC protected.
- [ ] Data persists correctly (`products` + `inventory`).
- [ ] Every product change updates vector index in same Supabase database.
- [ ] Admin UI is ready for use.

## Suggested commit
- `feat(admin): product and inventory CRUD (pt-BR)`
