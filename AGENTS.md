# CLAUDE.md / AGENTS.md - Project Guide (Online Store)

This file defines how the agent (Codex/Claude Code) should work in this repository and which project rules must be followed.

> **Important (user-facing text):** all messages shown to users in frontend and backend must be in **Portuguese (Brazil) - pt-BR**.  
> **Important (source code):** all source code (file names, classes, methods, variables, and technical comments) must be in **English**.

---

## 1) What this project is

An online store with:
- Angular 21 frontend
- Node.js + TypeScript backend (REST API)
- PostgreSQL relational database
- Vector RAG using pgvector for semantic product search

Access profiles:
- `ADMIN` - full access
- `MANAGER` - operations access (products/inventory, orders/sales, RAG)
- `CUSTOMER` - shopper (catalog, cart, checkout, my orders, profile)

Main flows:
- Customer: catalog -> cart -> login at checkout -> place order -> my orders -> cancellation within 3 days if not delivered
- Admin/Manager: product + inventory CRUD -> orders/sales -> RAG search
- Sync rule: when product data changes in relational DB, generate markdown and upsert in pgvector

---

## 2) Language rules (required)

### 2.1 Source code (English)
- Classes, methods, variables, file names, enums, interfaces, and technical comments in English
- Method header comments (when needed): max 2 lines, in English

### 2.2 User-facing messages (pt-BR)
- Frontend: labels, buttons, placeholders, validation, toasts/snackbars, and errors
- Backend: response `mensagem`, validation messages, and failure responses
- Standard error example:
```json
{ "mensagem": "Não foi possível concluir a operação.", "detalhes": { "campo": "..." } }
```

### 2.3 Encoding and accents (required)
- All user-facing text must be written in proper pt-BR with accents (UTF-8), for example: `não`, `você`, `usuário`, `operação`.
- Do not use ASCII fallback in user text (for example: `nao`, `voce`, `usuario`, `operacao`).
- Do not use Unicode escape sequences in user text (for example: `\u00EA`, `\u00E3`); write the actual characters.

---

## 3) Conventions and standards

### 3.1 Backend architecture (layers)
- `routes` -> `controllers` -> `services` -> `repositories`
- Business rules in services (checkout, cancellation, order status, RAG)
- Data access isolated in repositories
- Global error middleware standardizes pt-BR responses

### 3.2 Frontend (Angular 21)
- Prefer Signals for state
- Prefer Signal Forms for typed forms
- Guards:
  - `authGuard`
  - `roleGuard` (ADMIN/MANAGER)
- Interceptors for JWT and API error normalization

### 3.3 Testing
- Frontend: Jest unit tests
- Backend: unit tests for services

### 3.4 Quality
- Avoid `any` (prefer `unknown` + refinement)
- Run lint before finishing a delivery
- Deliver in small stages with clear commits
- Before finalizing, validate user-facing text for proper accents (pt-BR) and ensure there are no ASCII fallbacks (`nao`, `voce`, `usuario`) or Unicode escapes (`\u00XX`).

---

## 4) Database

### 4.1 Relational (PostgreSQL)
Main entities:
- users (roles + credentials)
- customers_profile (cpf + personal data + address)
- products + inventory
- orders + order_items (with snapshots)
- audit_log

Critical operations must run in transactions:
- checkout: create order + decrement stock (`SELECT ... FOR UPDATE`)
- cancellation: validate rule + restore stock + update status

### 4.2 Vector (pgvector)
Suggested table `rag_products`:
- `product_id` (PK and product reference)
- `content_markdown` (rich product text)
- `embedding` (vector DIM)
- metadata (`category`, `sale_price`, `weight`, `updated_at`)

Rule:
- on create/update product: save relational -> generate markdown -> generate embedding -> upsert in `rag_products`

---

## 5) Recommended roadmap (stages)

Task checklists live in `/tasks/*.md`.  
Do not implement everything at once. Execute one stage at a time and commit when the stage is complete.

Example stages:
- 00 bootstrap (frontend + backend + postgres)
- 01 auth + RBAC
- 02 customer profile
- 03 catalog
- 04 cart + checkout
- 05 my orders + cancellation
- 06 admin products + inventory
- 07 rag (indexing + search)
- 08 admin orders/status

---

## 6) Execution commands (adapt to repo)

### 6.1 Infrastructure
- `docker compose up -d`

### 6.2 Backend
- `npm install`
- `npm run dev`
- `npm run lint`
- `npm test` (if configured)

### 6.3 Frontend
- `npm install`
- `npm start`
- `npm run lint`
- `npm test` (Jest)

---

## 7) How the agent should work

### 7.1 Standard flow per stage
1. Read `/tasks/<stage>.md`
2. Implement only the described scope
3. Ensure build/lint/tests are OK (when available)
4. Create one clear commit
5. Push to `main` when requested

### 7.2 Commit standards
- Small but complete commits per stage
- Commit message with a clear summary

---

## 8) Mandatory skill routing

The agent must route work to these skills:

- Never use `moai-domain-frontend` in this repository.
- Any frontend code request: always use `angular21-enterprise.skill.md`.
- Frontend UX/UI quality: always apply `05-skill-ux-ui-professional.md` together with `angular21-enterprise.skill.md`.
- Any Node.js backend code request: always use `node-ecommerce-nestjs.skill.md`.
- Relational database work: always use `03-skill-postgres-relational`.
- Vector database / RAG work: always use `04-skill-pgvector-rag`.
- Whenever the user asks to commit and push: always use `SKILL_commit_push_main`.

---

## 9) `/init` behavior

When the user asks for `/init`, the agent must:
- create/update `CLAUDE.md` and `AGENTS.md` with project rules
- ensure `/tasks` exists and is updated
- ensure language rules are explicit (code in English, user-facing messages in pt-BR)

---

END.
