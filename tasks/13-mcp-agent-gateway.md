# Stage 13 - MCP Agent Gateway for multi-source retrieval

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
Expose an MCP server as a unified tool gateway so the agent can decide which retrieval path to use and which data source to query:
- relational analytics (SQL truth source)
- operational vector knowledge
- strategic vector knowledge
- hybrid composition when needed

## Scope and architecture
- Keep routing decision in agent orchestration layer.
- Use MCP as the execution boundary for data access tools.
- Ensure each MCP tool has strict input/output contracts.
- Return source trace for every answer (route + evidence).

## Mandatory truth-source policy
- Exact KPI/count questions (example: "quantas vendas nos ultimos 3 dias?") must use SQL tool as source of truth.
- RAG tools may enrich explanation, but must not replace exact numeric SQL results.

## Task checklist
### MCP server foundation
- [ ] Create MCP server module/service for agent data tools.
- [ ] Define auth between app backend and MCP server (service token or signed context).
- [ ] Define tool schema validation (input/output) with strong typing.

### MCP tools (minimum set)
- [ ] `sql_analytics_query`
  - [ ] purpose: exact metrics/counts from relational database
  - [ ] input: `question`, optional `dateRange`, optional filters
  - [ ] output: rows/aggregates + execution metadata
- [ ] `rag_operational_search`
  - [ ] purpose: semantic retrieval over operational index
  - [ ] input: `query`, optional `topK`, optional entity filters
  - [ ] output: ranked docs with score + metadata
- [ ] `rag_strategic_search`
  - [ ] purpose: semantic retrieval over strategic index/base
  - [ ] input: `query`, optional `topK`, optional topic filters
  - [ ] output: ranked docs with score + metadata
- [ ] `hybrid_context_merge` (optional v1)
  - [ ] purpose: merge/rerank contexts from multiple tools
  - [ ] output: normalized context blocks for final generation

### Agent integration
- [ ] Connect `AgentRouterService` to MCP tools instead of direct repository calls.
- [ ] Implement route mapping:
  - [ ] `SQL_ANALYTICS` -> `sql_analytics_query`
  - [ ] `RAG_OPERATIONAL` -> `rag_operational_search`
  - [ ] `RAG_STRATEGIC` -> `rag_strategic_search`
  - [ ] `HYBRID` -> 2+ tools + merge strategy
- [ ] Enforce SQL-first policy for exact KPI/count intent.

### API and response contract
- [ ] Update `POST /admin/agent/ask` response to include:
  - [ ] `answer`
  - [ ] `route`
  - [ ] `toolsUsed`
  - [ ] `sources` (SQL rows/doc references)
  - [ ] `warnings` (if partial data or fallback used)
- [ ] Keep user-facing response messages in pt-BR.

### Observability and safety
- [ ] Add structured logs per tool call (latency, status, errors).
- [ ] Add correlation id across agent request -> MCP tool execution.
- [ ] Add guardrails for:
  - [ ] unsafe/out-of-scope prompts
  - [ ] prompt injection attempts in retrieved context
  - [ ] missing-source responses for exact KPI questions

### Tests
- [ ] Unit tests for tool schema validation.
- [ ] Unit tests for route-to-tool mapping.
- [ ] Integration tests for:
  - [ ] KPI question routes to SQL tool
  - [ ] strategy question routes to strategic RAG tool
  - [ ] mixed question routes to hybrid path with source trace

## Acceptance criteria
- [ ] MCP tools are operational and callable by agent layer.
- [ ] Agent selects correct tool path based on intent.
- [ ] Exact KPI/count answers are grounded in SQL output.
- [ ] Responses include route/tool/source transparency.
- [ ] User-facing messages remain pt-BR compliant.

## Suggested commit
- `feat(agent): add mcp gateway tools for sql and multi-rag routing`
