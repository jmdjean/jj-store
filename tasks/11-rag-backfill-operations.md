# Stage 11 - RAG backfill, reindexing, and operations

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
Provide safe operations to populate and maintain vector index for existing and evolving production data.

## Task checklist
### Initial backfill
- [x] Create job/script to reindex existing relational data into `rag_documents`.
- [x] Process in batches to avoid overload.
- [x] Guarantee idempotency (safe to rerun without duplicates).
- [x] Generate final report: processed total, success, failures, elapsed time.

### Controlled reindexing
- [x] Create command to reindex by:
  - [x] `entity_type`
  - [x] date range
  - [x] specific entity (`entity_type` + `entity_id`)
- [x] Create `dry-run` mode to estimate volume without writing.

### Operational resilience
- [x] Define retry policy for temporary embedding failures.
- [x] Define reprocessing queue for permanent failures (dead-letter or dedicated failure log).
- [x] Define minimal alerts (example: failure rate over threshold).

### Documentation
- [x] Document runbook:
  - [x] how to execute backfill in staging/production
  - [x] how to reprocess failures
  - [x] how to validate semantic result quality
- [x] Document limits/risks (cost, latency, batch size).

## Acceptance criteria
- [x] Legacy data is indexed without duplication.
- [x] Partial reindex works as expected.
- [x] Operations have enough logs/metrics for support.
- [x] Runbook is documented for technical team.

## Suggested commit
- `chore(rag): backfill and vector reindex operations`
