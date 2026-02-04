# Stage 09 - RAG Foundation on Supabase (single relational + vector schema)

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
Create the RAG technical foundation in the same Supabase PostgreSQL database used by the system.

## Mandatory technical guideline
- Use **one single Supabase PostgreSQL database**, IPv4-compatible through Supabase pooler/connection string.
- Enable `pgvector` in the same database.
- Standardize one vector table (`rag_documents`) for all entities.

## Task checklist
### Database (SQL migration)
- [ ] Enable required extensions (`vector`, `pgcrypto`).
- [ ] Create `rag_documents` with minimum fields:
  - [ ] `id` (uuid)
  - [ ] `entity_type` (text)
  - [ ] `entity_id` (uuid)
  - [ ] `content_markdown` (text)
  - [ ] `embedding` (`vector(N)`)
  - [ ] `metadata_json` (jsonb)
  - [ ] `source_updated_at`, `created_at`, `updated_at`
- [ ] Add `unique(entity_type, entity_id)`.
- [ ] Add support indexes:
  - [ ] entity index (`entity_type`, `entity_id`)
  - [ ] `gin` index for `metadata_json`
  - [ ] vector index (`ivfflat` or equivalent)

### Database (semantic query)
- [ ] Create SQL function `rag_search` (or equivalent) to:
  - [ ] receive query embedding
  - [ ] support `topK`
  - [ ] support optional `entity_types` filter
  - [ ] return score + document + metadata

### Backend (configuration)
- [ ] Configure environment vars for:
  - [ ] Supabase/Postgres connection
  - [ ] embeddings provider
  - [ ] embedding dimension (`EMBEDDING_DIM`)
- [ ] Validate at bootstrap that DB vector dimension matches configured provider.

## Acceptance criteria
- [ ] Single Supabase database works for relational and vector data.
- [ ] `rag_documents` is created and accessible.
- [ ] `rag_search` works with similarity output.
- [ ] Configuration is ready for automatic sync stages.

## Suggested commit
- `feat(rag): supabase vector foundation with pgvector`
