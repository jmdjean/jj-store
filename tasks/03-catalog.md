# Stage 03 - Public Catalog + Product Detail

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
- In this stage (public catalog), no new registration flow is created. Vector indexing is fed by admin create/update flows.

## Objective
Display public product listing and product details page.

## Task checklist
### Database/Seed
- [ ] Create `products` and `inventory` tables (if missing).
- [ ] Add seed data for development.
- [ ] Ensure `products`/`inventory` live in the same Supabase PostgreSQL used by RAG.

### Backend
- [ ] `GET /products` (public):
  - filters: `q` (text), `category`, `minPrice`, `maxPrice`
  - pagination: `page`, `pageSize`
- [ ] `GET /products/:id` (public)
- [ ] Keep responses in pt-BR when needed (example: "Produto nao encontrado").

### Frontend (professional UI)
- [ ] Catalog page:
  - product cards (image, name, price, category)
  - search and filters
  - responsive layout
- [ ] Product detail page:
  - image (if available)
  - description, weight, price, availability
  - "Adicionar ao carrinho" button
- [ ] pt-BR messages (example: "Sem resultados").

## Acceptance criteria
- [ ] Catalog lists products and applies filters.
- [ ] Detail page opens correctly.
- [ ] UI has store-like structure (header with search and cart).

## Suggested commit
- `feat(catalog): public listing and product details (pt-BR)`
