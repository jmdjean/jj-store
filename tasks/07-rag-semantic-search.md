# Stage 07 - RAG v1: Registration Indexing (Markdown -> Vector) + Semantic Search

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
- Mandatory rule for **every relevant create/update** (product, manager, customer, order, order_item, etc.):
  1) relational persistence succeeds;
  2) record is transformed into standardized `.md`;
  3) embedding is generated;
  4) vector record is inserted/upserted.

## Objective
Establish unified RAG architecture in Supabase with vector indexing for all key registrations and semantic search for ADMIN/MANAGER.

## Technical decision (v1)
- Implement RAG with **pgvector** inside Supabase PostgreSQL (no separate vector database).
- Create unified vector structure (example: `rag_documents`) with minimum fields:
  - `id`, `entity_type`, `entity_id`, `content_markdown`, `embedding`, `metadata_json`, `updated_at`
- Standardize Markdown templates by entity (`product`, `customer`, `manager`, `order`, `order_item`, etc.).

## Task checklist
### Backend
- [ ] Implement Markdown generator per entity type.
- [ ] Implement embedding service with retry and failure handling.
- [ ] Implement automatic post-relational sync for:
  - [ ] products
  - [ ] customers
  - [ ] managers
  - [ ] orders and items
- [ ] `POST /admin/rag/search` (ADMIN/MANAGER):
  - input: `{ "query": "text...", "topK": 5, "entityTypes": [] }`
  - generate query embedding
  - search topK similar documents in pgvector
  - return `entity_type`, `entity_id`, score, snippet, pt-BR message
- [ ] Standardize pt-BR error responses.

### Frontend
- [ ] "Pesquisar RAG" screen (admin/manager):
  - textarea + search button
  - loading state
  - optional filters by entity type
  - response/results with "fontes"
- [ ] pt-BR messages (example: "Digite uma pergunta para pesquisar").

## Acceptance criteria
- [ ] Every relevant registration creates/updates vector Markdown document in same Supabase database.
- [ ] Search returns coherent topK results with filters.
- [ ] UI displays results clearly.

## Suggested commit
- `feat(rag): unified vector indexing and semantic search (pt-BR)`
