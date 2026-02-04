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
- [ ] Create job/script to reindex existing relational data into `rag_documents`.
- [ ] Process in batches to avoid overload.
- [ ] Guarantee idempotency (safe to rerun without duplicates).
- [ ] Generate final report: processed total, success, failures, elapsed time.

### Controlled reindexing
- [ ] Create command to reindex by:
  - [ ] `entity_type`
  - [ ] date range
  - [ ] specific entity (`entity_type` + `entity_id`)
- [ ] Create `dry-run` mode to estimate volume without writing.

### Operational resilience
- [ ] Define retry policy for temporary embedding failures.
- [ ] Define reprocessing queue for permanent failures (dead-letter or dedicated failure log).
- [ ] Define minimal alerts (example: failure rate over threshold).

### Documentation
- [ ] Document runbook:
  - [ ] how to execute backfill in staging/production
  - [ ] how to reprocess failures
  - [ ] how to validate semantic result quality
- [ ] Document limits/risks (cost, latency, batch size).

## Acceptance criteria
- [ ] Legacy data is indexed without duplication.
- [ ] Partial reindex works as expected.
- [ ] Operations have enough logs/metrics for support.
- [ ] Runbook is documented for technical team.

## Suggested commit
- `chore(rag): backfill and vector reindex operations`
