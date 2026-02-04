# Stage 12 - Agent routing for multi-RAG + SQL truth source

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
Implement an agent that decides the best retrieval path per admin/manager question:
- operational data (sales, stock, customers, orders)
- strategic knowledge (sales tactics, business playbooks, internal guidance)
- or both, when needed.

## Routing design (v1)
- Create routing targets:
  - `SQL_ANALYTICS` (authoritative metrics/counts from relational DB)
  - `RAG_OPERATIONAL` (vector index over system entities)
  - `RAG_STRATEGIC` (second vector base/index with business guidance)
  - `HYBRID` (combine SQL + one/both RAG sources)
- Add router service (`AgentRouterService`) to classify intent and choose route.
- Start with deterministic rules, then optional LLM classifier fallback.

## Mandatory rule for factual metrics
- Questions asking exact numbers (example: "quantas vendas nos ultimos 3 dias?") must use **SQL_ANALYTICS** as source of truth.
- RAG can enrich explanation, but exact counts must come from SQL query results.

## Task checklist
### Data sources and adapters
- [ ] Create retriever interface (common contract):
  - [ ] `retrieve(query, options)`
- [ ] Implement adapters:
  - [ ] relational analytics retriever (SQL)
  - [ ] operational RAG retriever
  - [ ] strategic RAG retriever

### Agent orchestration
- [ ] Build orchestration service:
  - [ ] route question
  - [ ] call selected retriever(s)
  - [ ] merge/rank contexts
  - [ ] build final prompt for answer generation
- [ ] Return answer with source trace:
  - [ ] selected route
  - [ ] cited sources/documents
  - [ ] confidence indicator (optional v1)

### API and frontend
- [ ] Implement endpoint: `POST /admin/agent/ask` (ADMIN/MANAGER)
  - [ ] input: `question`, optional filters
  - [ ] output: `answer`, `route`, `sources`
  - [ ] pt-BR messages
- [ ] Update admin ask screen to display:
  - [ ] answer text
  - [ ] route used
  - [ ] source list (SQL/RAG operational/RAG strategic)

### Quality and safety
- [ ] Add guardrails:
  - [ ] reject out-of-scope or unsafe prompts
  - [ ] avoid hallucinated exact metrics when SQL is required
- [ ] Add tests for routing behavior:
  - [ ] numeric KPI question -> SQL path
  - [ ] product strategy question -> strategic RAG
  - [ ] mixed question -> hybrid path

## Acceptance criteria
- [ ] Agent routes questions to correct source path.
- [ ] KPI/exact-count answers come from SQL truth source.
- [ ] Strategic questions use strategic vector knowledge.
- [ ] Mixed questions can use hybrid retrieval and cite sources.

## Suggested commit
- `feat(agent): multi-rag routing with sql truth-source enforcement`
