import { AppError } from '../common/app-error.js';
import { RagRepository, type RagEntityType } from '../repositories/rag.repository.js';
import { SqlAnalyticsRepository } from '../repositories/sql-analytics.repository.js';
import { RagSyncService } from './rag-sync.service.js';
import type {
  SqlAnalyticsInput,
  SqlAnalyticsOutput,
  RagOperationalInput,
  RagOperationalOutput,
  RagStrategicInput,
  RagStrategicOutput,
  HybridMergeInput,
  HybridMergeOutput,
  RagDocResult,
  ContextBlock,
  McpToolCallLog,
  McpCorrelationContext,
} from './mcp.types.js';

type McpLogger = {
  info: (payload: Record<string, unknown>) => void;
  error: (payload: Record<string, unknown>) => void;
};

const ALLOWED_ENTITY_TYPES: RagEntityType[] = ['product', 'customer', 'manager', 'order', 'order_item'];
const MAX_TOP_K = 20;
const MIN_TOP_K = 1;
const DEFAULT_TOP_K = 5;

export class McpToolsService {
  private readonly logger: McpLogger;

  constructor(
    private readonly sqlAnalyticsRepository: SqlAnalyticsRepository,
    private readonly ragSyncService: RagSyncService,
    private readonly ragRepository: RagRepository,
  ) {
    this.logger = {
      info: (payload) => console.info(JSON.stringify(payload)),
      error: (payload) => console.error(JSON.stringify(payload)),
    };
  }

  // Executes SQL analytics query tool for exact KPI/metric results.
  async executeSqlAnalytics(
    input: SqlAnalyticsInput,
    context: McpCorrelationContext,
  ): Promise<SqlAnalyticsOutput> {
    const startedAt = Date.now();

    try {
      this.validateSqlAnalyticsInput(input);

      const dateRange = input.dateRange ?? {};
      const question = input.question.toLowerCase();

      const rows = await this.dispatchSqlQuery(question, dateRange);

      const output: SqlAnalyticsOutput = {
        tool: 'sql_analytics_query',
        rows,
        rowCount: rows.length,
        queryDescription: this.describeSqlQuery(question),
        executionMs: Date.now() - startedAt,
      };

      this.logToolCall(context, {
        correlationId: context.correlationId,
        tool: 'sql_analytics_query',
        status: 'success',
        durationMs: output.executionMs,
      });

      return output;
    } catch (error) {
      this.logToolCall(context, {
        correlationId: context.correlationId,
        tool: 'sql_analytics_query',
        status: 'error',
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'unknown_error',
      });
      throw error;
    }
  }

  // Executes RAG operational search over operational entity index.
  async executeRagOperational(
    input: RagOperationalInput,
    context: McpCorrelationContext,
  ): Promise<RagOperationalOutput> {
    const startedAt = Date.now();

    try {
      this.validateRagOperationalInput(input);

      const topK = this.normalizeTopK(input.topK);
      const entityTypes = this.normalizeEntityTypes(input.entityTypes);

      const searchResult = await this.ragSyncService.search({
        query: input.query,
        topK,
        entityTypes,
      });

      const results: RagDocResult[] = searchResult.resultados.map((doc) => ({
        entityType: doc.entityType,
        entityId: doc.entityId,
        score: doc.score,
        snippet: doc.snippet,
        metadata: doc.metadata,
      }));

      const output: RagOperationalOutput = {
        tool: 'rag_operational_search',
        results,
        totalFound: results.length,
        executionMs: Date.now() - startedAt,
      };

      this.logToolCall(context, {
        correlationId: context.correlationId,
        tool: 'rag_operational_search',
        status: 'success',
        durationMs: output.executionMs,
      });

      return output;
    } catch (error) {
      this.logToolCall(context, {
        correlationId: context.correlationId,
        tool: 'rag_operational_search',
        status: 'error',
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'unknown_error',
      });
      throw error;
    }
  }

  // Executes RAG strategic search for knowledge-base topics.
  async executeRagStrategic(
    input: RagStrategicInput,
    context: McpCorrelationContext,
  ): Promise<RagStrategicOutput> {
    const startedAt = Date.now();

    try {
      this.validateRagStrategicInput(input);

      const topK = this.normalizeTopK(input.topK);

      const entityTypes: RagEntityType[] = this.mapTopicToEntityTypes(input.topicFilters);

      const searchResult = await this.ragSyncService.search({
        query: input.query,
        topK,
        entityTypes,
      });

      const results: RagDocResult[] = searchResult.resultados.map((doc) => ({
        entityType: doc.entityType,
        entityId: doc.entityId,
        score: doc.score,
        snippet: doc.snippet,
        metadata: doc.metadata,
      }));

      const output: RagStrategicOutput = {
        tool: 'rag_strategic_search',
        results,
        totalFound: results.length,
        executionMs: Date.now() - startedAt,
      };

      this.logToolCall(context, {
        correlationId: context.correlationId,
        tool: 'rag_strategic_search',
        status: 'success',
        durationMs: output.executionMs,
      });

      return output;
    } catch (error) {
      this.logToolCall(context, {
        correlationId: context.correlationId,
        tool: 'rag_strategic_search',
        status: 'error',
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'unknown_error',
      });
      throw error;
    }
  }

  // Executes hybrid merge combining SQL and RAG results.
  async executeHybridMerge(
    input: HybridMergeInput,
    context: McpCorrelationContext,
  ): Promise<HybridMergeOutput> {
    const startedAt = Date.now();

    try {
      this.validateHybridInput(input);

      const [sqlResult, ragResult] = await Promise.all([
        this.executeSqlAnalytics(
          { question: input.question, dateRange: input.dateRange },
          context,
        ),
        this.executeRagOperational(
          { query: input.question, topK: input.topK, entityTypes: input.entityTypes },
          context,
        ),
      ]);

      const blocks: ContextBlock[] = [];

      if (sqlResult.rowCount > 0) {
        blocks.push({
          source: 'sql_analytics_query',
          content: JSON.stringify(sqlResult.rows),
          confidence: 1.0,
          metadata: {
            rowCount: sqlResult.rowCount,
            queryDescription: sqlResult.queryDescription,
          },
        });
      }

      for (const doc of ragResult.results) {
        blocks.push({
          source: 'rag_operational_search',
          content: doc.snippet,
          confidence: doc.score,
          metadata: {
            entityType: doc.entityType,
            entityId: doc.entityId,
            ...doc.metadata,
          },
        });
      }

      blocks.sort((a, b) => b.confidence - a.confidence);

      const output: HybridMergeOutput = {
        tool: 'hybrid_context_merge',
        blocks,
        executionMs: Date.now() - startedAt,
      };

      this.logToolCall(context, {
        correlationId: context.correlationId,
        tool: 'hybrid_context_merge',
        status: 'success',
        durationMs: output.executionMs,
      });

      return output;
    } catch (error) {
      this.logToolCall(context, {
        correlationId: context.correlationId,
        tool: 'hybrid_context_merge',
        status: 'error',
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'unknown_error',
      });
      throw error;
    }
  }

  // Validates SQL analytics input schema.
  validateSqlAnalyticsInput(input: SqlAnalyticsInput): void {
    if (!input.question || typeof input.question !== 'string' || !input.question.trim()) {
      throw new AppError(400, 'Informe a pergunta para a consulta analítica.');
    }

    if (input.dateRange) {
      this.validateDateRange(input.dateRange);
    }
  }

  // Validates RAG operational input schema.
  validateRagOperationalInput(input: RagOperationalInput): void {
    if (!input.query || typeof input.query !== 'string' || !input.query.trim()) {
      throw new AppError(400, 'Informe a consulta para pesquisa operacional.');
    }

    if (input.topK !== undefined) {
      this.validateTopKValue(input.topK);
    }
  }

  // Validates RAG strategic input schema.
  validateRagStrategicInput(input: RagStrategicInput): void {
    if (!input.query || typeof input.query !== 'string' || !input.query.trim()) {
      throw new AppError(400, 'Informe a consulta para pesquisa estratégica.');
    }

    if (input.topK !== undefined) {
      this.validateTopKValue(input.topK);
    }
  }

  // Validates hybrid merge input schema.
  validateHybridInput(input: HybridMergeInput): void {
    if (!input.question || typeof input.question !== 'string' || !input.question.trim()) {
      throw new AppError(400, 'Informe a pergunta para a consulta híbrida.');
    }
  }

  // Dispatches to the appropriate SQL query based on question intent keywords.
  private async dispatchSqlQuery(
    question: string,
    dateRange: { from?: string; to?: string },
  ): Promise<Record<string, unknown>[]> {
    if (this.matchesKeywords(question, ['vendas', 'venda', 'faturamento', 'receita', 'revenue'])) {
      const rows = await this.sqlAnalyticsRepository.getSalesMetrics(dateRange);
      return rows as unknown as Record<string, unknown>[];
    }

    if (this.matchesKeywords(question, ['produto mais vendido', 'top produto', 'mais vendidos', 'ranking'])) {
      const rows = await this.sqlAnalyticsRepository.getTopProducts(dateRange);
      return rows as unknown as Record<string, unknown>[];
    }

    if (this.matchesKeywords(question, ['status pedido', 'pedidos por status', 'status dos pedidos'])) {
      const rows = await this.sqlAnalyticsRepository.getOrderStatusCounts(dateRange);
      return rows as unknown as Record<string, unknown>[];
    }

    if (this.matchesKeywords(question, ['cliente', 'clientes', 'customer'])) {
      const rows = await this.sqlAnalyticsRepository.getCustomerMetrics();
      return rows as unknown as Record<string, unknown>[];
    }

    if (this.matchesKeywords(question, ['estoque', 'inventário', 'stock', 'estoque baixo'])) {
      const rows = await this.sqlAnalyticsRepository.getLowStockProducts();
      return rows as unknown as Record<string, unknown>[];
    }

    if (this.matchesKeywords(question, ['diário', 'diario', 'dia a dia', 'daily', 'por dia'])) {
      const rows = await this.sqlAnalyticsRepository.getDailyRevenue(dateRange);
      return rows;
    }

    const rows = await this.sqlAnalyticsRepository.getSalesMetrics(dateRange);
    return rows as unknown as Record<string, unknown>[];
  }

  // Maps topic filters to entity types for strategic search.
  private mapTopicToEntityTypes(topicFilters?: string[]): RagEntityType[] {
    if (!topicFilters || topicFilters.length === 0) {
      return [];
    }

    const mapped: RagEntityType[] = [];

    for (const topic of topicFilters) {
      const normalized = topic.trim().toLowerCase();

      if (normalized === 'products' || normalized === 'produtos') {
        mapped.push('product');
      } else if (normalized === 'customers' || normalized === 'clientes') {
        mapped.push('customer');
      } else if (normalized === 'orders' || normalized === 'pedidos') {
        mapped.push('order');
      } else if (normalized === 'managers' || normalized === 'gestores') {
        mapped.push('manager');
      }
    }

    return mapped;
  }

  // Describes the SQL query executed based on question keywords.
  private describeSqlQuery(question: string): string {
    if (this.matchesKeywords(question, ['vendas', 'venda', 'faturamento', 'receita'])) {
      return 'Métricas de vendas agregadas';
    }
    if (this.matchesKeywords(question, ['produto mais vendido', 'top produto', 'mais vendidos'])) {
      return 'Ranking de produtos mais vendidos';
    }
    if (this.matchesKeywords(question, ['status pedido', 'pedidos por status'])) {
      return 'Contagem de pedidos por status';
    }
    if (this.matchesKeywords(question, ['cliente', 'clientes'])) {
      return 'Métricas de clientes';
    }
    if (this.matchesKeywords(question, ['estoque', 'inventário', 'stock'])) {
      return 'Alertas de estoque baixo';
    }
    if (this.matchesKeywords(question, ['diário', 'diario', 'por dia'])) {
      return 'Receita diária';
    }
    return 'Métricas gerais de vendas';
  }

  // Checks whether the question contains any of the provided keywords.
  private matchesKeywords(question: string, keywords: string[]): boolean {
    return keywords.some((keyword) => question.includes(keyword));
  }

  // Validates date range format.
  private validateDateRange(dateRange: { from?: string; to?: string }): void {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (dateRange.from && !datePattern.test(dateRange.from)) {
      throw new AppError(400, 'Data inicial inválida. Use o formato AAAA-MM-DD.');
    }
    if (dateRange.to && !datePattern.test(dateRange.to)) {
      throw new AppError(400, 'Data final inválida. Use o formato AAAA-MM-DD.');
    }
  }

  // Validates topK value boundaries.
  private validateTopKValue(topK: number): void {
    if (!Number.isInteger(topK) || topK < MIN_TOP_K || topK > MAX_TOP_K) {
      throw new AppError(400, `Informe um topK entre ${MIN_TOP_K} e ${MAX_TOP_K}.`);
    }
  }

  // Normalizes topK with default and boundary enforcement.
  private normalizeTopK(topK: number | undefined): number {
    if (topK === undefined) return DEFAULT_TOP_K;
    return Math.max(MIN_TOP_K, Math.min(MAX_TOP_K, topK));
  }

  // Normalizes entity type filters.
  private normalizeEntityTypes(entityTypes: RagEntityType[] | undefined): string[] {
    if (!entityTypes || entityTypes.length === 0) return [];

    return entityTypes.filter((type) =>
      ALLOWED_ENTITY_TYPES.includes(type),
    );
  }

  // Logs a tool call event with structured data.
  private logToolCall(context: McpCorrelationContext, log: McpToolCallLog): void {
    const logEntry = {
      event: 'mcp_tool_call',
      ...log,
      actorUserId: context.actorUserId,
      actorRole: context.actorRole,
    };

    if (log.status === 'success') {
      this.logger.info(logEntry);
    } else {
      this.logger.error(logEntry);
    }
  }
}
