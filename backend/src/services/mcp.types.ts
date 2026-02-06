import type { RagEntityType } from '../repositories/rag.repository.js';

// ── Agent route enum ──

export type AgentRoute = 'SQL_ANALYTICS' | 'RAG_OPERATIONAL' | 'RAG_STRATEGIC' | 'HYBRID';

// ── MCP tool names ──

export type McpToolName =
  | 'sql_analytics_query'
  | 'rag_operational_search'
  | 'rag_strategic_search'
  | 'hybrid_context_merge';

// ── sql_analytics_query ──

export type SqlAnalyticsInput = {
  question: string;
  dateRange?: { from?: string; to?: string };
  filters?: Record<string, unknown>;
};

export type SqlAnalyticsRow = Record<string, unknown>;

export type SqlAnalyticsOutput = {
  tool: 'sql_analytics_query';
  rows: SqlAnalyticsRow[];
  rowCount: number;
  queryDescription: string;
  executionMs: number;
};

// ── rag_operational_search ──

export type RagOperationalInput = {
  query: string;
  topK?: number;
  entityTypes?: RagEntityType[];
};

export type RagDocResult = {
  entityType: RagEntityType;
  entityId: string;
  score: number;
  snippet: string;
  metadata: Record<string, unknown>;
};

export type RagOperationalOutput = {
  tool: 'rag_operational_search';
  results: RagDocResult[];
  totalFound: number;
  executionMs: number;
};

// ── rag_strategic_search ──

export type RagStrategicInput = {
  query: string;
  topK?: number;
  topicFilters?: string[];
};

export type RagStrategicOutput = {
  tool: 'rag_strategic_search';
  results: RagDocResult[];
  totalFound: number;
  executionMs: number;
};

// ── hybrid_context_merge ──

export type HybridMergeInput = {
  question: string;
  dateRange?: { from?: string; to?: string };
  topK?: number;
  entityTypes?: RagEntityType[];
};

export type ContextBlock = {
  source: McpToolName;
  content: string;
  confidence: number;
  metadata: Record<string, unknown>;
};

export type HybridMergeOutput = {
  tool: 'hybrid_context_merge';
  blocks: ContextBlock[];
  executionMs: number;
};

// ── Unified tool result ──

export type McpToolOutput =
  | SqlAnalyticsOutput
  | RagOperationalOutput
  | RagStrategicOutput
  | HybridMergeOutput;

// ── Agent ask request / response ──

export type AgentAskInput = {
  question: string;
  dateRange?: { from?: string; to?: string };
  topK?: number;
  entityTypes?: string[];
};

export type AgentSourceRef = {
  tipo: string;
  id: string;
  titulo: string;
  score?: number;
};

export type AgentAskResponse = {
  mensagem: string;
  resposta: string;
  rota: AgentRoute;
  ferramentasUsadas: McpToolName[];
  fontes: AgentSourceRef[];
  avisos?: string[];
};

// ── Correlation context ──

export type McpCorrelationContext = {
  correlationId: string;
  actorUserId: string;
  actorRole: string;
  startedAt: number;
};

// ── Tool call log entry ──

export type McpToolCallLog = {
  correlationId: string;
  tool: McpToolName;
  status: 'success' | 'error';
  durationMs: number;
  error?: string;
};
