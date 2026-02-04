# Stage 10 - Automatic registration sync to RAG (Markdown -> Vector)

# Global conventions (applies to all stages)

> **Language standard (mandatory):** all user-facing system language must be **Portuguese (Brazil) - pt-BR**,
> including: success/error messages, validations, API responses, UI labels/placeholders,
> user-facing logs (when applicable), and screen documentation.

## Delivery rules
- Implement **only** this stage scope.
- Keep backend layered architecture (routes/controllers -> services -> repositories).
- Ensure **build/tests** pass (when available).
- At the end, create **1 commit** with a clear message.

## Objective
Ensure **every relevant create/update** in the system automatically syncs relational + vector layers in Supabase.

## Mandatory business rule
For each indexed entity (product, customer, manager, order, order_item, etc.):
1) persist relational data successfully;
2) generate canonical Markdown;
3) generate embedding;
4) upsert in `rag_documents`.

> If relational persistence fails, vector indexing must not run.

## Task checklist
### Backend (RAG domain)
- [ ] Create `RagSyncService` (or equivalent) with:
  - [ ] `upsertDocument(entityType, entityId, markdown, metadata, sourceUpdatedAt)`
  - [ ] `deleteDocument(entityType, entityId)` (for delete flows)
  - [ ] `search(query, topK, entityTypes)`
- [ ] Implement embedding provider integration with retry and timeout.
- [ ] Implement Markdown templates/mappers by entity:
  - [ ] `product`
  - [ ] `customer`
  - [ ] `manager`
  - [ ] `order`
  - [ ] `order_item`

### Backend (flow integration)
- [ ] Integrate sync on product create/update.
- [ ] Integrate sync on customer create/update.
- [ ] Integrate sync on manager create/update.
- [ ] Integrate sync on checkout (order + items).
- [ ] Integrate sync on cancellation and order status updates.

### Admin semantic search API
- [ ] Implement `POST /admin/rag/search` (ADMIN/MANAGER):
  - [ ] input: `query`, optional `topK`, optional `entityTypes`
  - [ ] output: `entity_type`, `entity_id`, `score`, `snippet`, `metadata`
  - [ ] pt-BR success/error messages

### Quality and observability
- [ ] Structured logs for indexing success/failure.
- [ ] Minimum metrics: indexed count, fail count, embedding latency.
- [ ] Unit tests for:
  - [ ] Markdown templates
  - [ ] upsert behavior
  - [ ] semantic search service layer

## Acceptance criteria
- [ ] Every relevant registration syncs automatically to `rag_documents`.
- [ ] Relational layer remains source of truth.
- [ ] Admin semantic search returns coherent results.
- [ ] Embedding/index failures are logged and traceable.

## Suggested commit
- `feat(rag): automatic registration sync to vector index`
