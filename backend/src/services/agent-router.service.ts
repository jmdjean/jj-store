import { AppError } from '../common/app-error.js';
import type {
  AgentAskInput,
  AgentAskResponse,
  AgentRoute,
  AgentSourceRef,
  McpToolName,
  McpCorrelationContext,
  SqlAnalyticsOutput,
  RagOperationalOutput,
  RagStrategicOutput,
  HybridMergeOutput,
} from './mcp.types.js';
import { McpServerService } from './mcp-server.service.js';

type RouterLogger = {
  info: (payload: Record<string, unknown>) => void;
  error: (payload: Record<string, unknown>) => void;
};

// Keywords that indicate exact KPI/count intent requiring SQL.
const SQL_INTENT_KEYWORDS = [
  'quantas', 'quantos', 'quanto', 'total', 'soma', 'média', 'media',
  'faturamento', 'receita', 'vendas', 'venda', 'pedidos',
  'estoque', 'inventário', 'inventario',
  'ranking', 'mais vendido', 'mais vendidos', 'top',
  'cancelados', 'canceladas', 'entregues', 'criados',
  'contagem', 'contabilizar', 'contar',
  'últimos dias', 'ultimos dias', 'último mês', 'ultimo mes',
  'clientes cadastrados', 'clientes com pedidos',
];

// Keywords that indicate strategic/knowledge-base intent.
const STRATEGIC_INTENT_KEYWORDS = [
  'estratégia', 'estrategia', 'tendência', 'tendencia',
  'análise', 'analise', 'insight', 'padrão', 'padrao',
  'perfil', 'comportamento', 'recomendação', 'recomendacao',
  'segmento', 'segmentação', 'segmentacao',
];

// Keywords that indicate operational RAG intent.
const OPERATIONAL_INTENT_KEYWORDS = [
  'produto', 'produtos', 'descreva', 'detalhe', 'informações',
  'informacoes', 'sobre o', 'sobre a', 'características',
  'caracteristicas', 'similar', 'parecido', 'semelhante',
  'cliente', 'pedido', 'gestor',
];

// Patterns that indicate unsafe or out-of-scope prompts.
const UNSAFE_PATTERNS = [
  /drop\s+table/i,
  /delete\s+from/i,
  /truncate/i,
  /alter\s+table/i,
  /insert\s+into/i,
  /update\s+.*\s+set/i,
  /;\s*--/,
  /union\s+select/i,
  /exec\s*\(/i,
  /xp_cmdshell/i,
  /script>/i,
  /<iframe/i,
  /javascript:/i,
  /ignore\s+(previous|above|all)\s+(instructions|prompts)/i,
  /you\s+are\s+now/i,
  /pretend\s+you/i,
  /system\s*prompt/i,
  /forget\s+(your|all|previous)/i,
];

export class AgentRouterService {
  private readonly logger: RouterLogger;

  constructor(private readonly mcpServer: McpServerService) {
    this.logger = {
      info: (payload) => console.info(JSON.stringify(payload)),
      error: (payload) => console.error(JSON.stringify(payload)),
    };
  }

  // Processes the agent question, classifies intent, routes to MCP tools, and returns the response.
  async ask(
    input: AgentAskInput,
    context: McpCorrelationContext,
  ): Promise<AgentAskResponse> {
    const startedAt = Date.now();
    const question = this.validateAndNormalizeQuestion(input.question);
    const avisos: string[] = [];

    this.enforceGuardrails(question);

    const route = this.classifyRoute(question);

    this.logger.info({
      event: 'agent_route_classified',
      correlationId: context.correlationId,
      question: question.slice(0, 200),
      route,
    });

    const toolsUsed: McpToolName[] = [];
    const fontes: AgentSourceRef[] = [];
    let resposta = '';

    switch (route) {
      case 'SQL_ANALYTICS': {
        const sqlResult = await this.executeSqlRoute(input, context);
        toolsUsed.push('sql_analytics_query');
        resposta = this.formatSqlResponse(sqlResult);
        fontes.push(...this.extractSqlSources(sqlResult));
        break;
      }

      case 'RAG_OPERATIONAL': {
        const ragResult = await this.executeRagOperationalRoute(input, context);
        toolsUsed.push('rag_operational_search');
        resposta = this.formatRagResponse(ragResult);
        fontes.push(...this.extractRagSources(ragResult));
        break;
      }

      case 'RAG_STRATEGIC': {
        const strategicResult = await this.executeRagStrategicRoute(input, context);
        toolsUsed.push('rag_strategic_search');
        resposta = this.formatStrategicResponse(strategicResult);
        fontes.push(...this.extractRagStrategicSources(strategicResult));
        break;
      }

      case 'HYBRID': {
        const hybridResult = await this.executeHybridRoute(input, context);
        toolsUsed.push('sql_analytics_query', 'rag_operational_search', 'hybrid_context_merge');
        resposta = this.formatHybridResponse(hybridResult);
        fontes.push(...this.extractHybridSources(hybridResult));
        break;
      }
    }

    if (this.isSqlIntentQuestion(question) && route !== 'SQL_ANALYTICS' && route !== 'HYBRID') {
      avisos.push('A pergunta parece exigir dados exatos. A resposta pode não refletir métricas precisas.');
    }

    if (fontes.length === 0) {
      avisos.push('Nenhuma fonte de dados encontrada para a pergunta informada.');
    }

    const durationMs = Date.now() - startedAt;

    this.logger.info({
      event: 'agent_ask_completed',
      correlationId: context.correlationId,
      route,
      toolsUsed,
      sourceCount: fontes.length,
      durationMs,
    });

    return {
      mensagem: 'Consulta processada com sucesso.',
      resposta,
      rota: route,
      ferramentasUsadas: toolsUsed,
      fontes,
      avisos: avisos.length > 0 ? avisos : undefined,
    };
  }

  // Classifies the question into the best route based on intent keywords.
  classifyRoute(question: string): AgentRoute {
    const normalized = question.toLowerCase();

    if (this.isSqlIntentQuestion(normalized)) {
      if (this.hasOperationalContext(normalized) || this.hasStrategicContext(normalized)) {
        return 'HYBRID';
      }
      return 'SQL_ANALYTICS';
    }

    if (this.hasStrategicContext(normalized)) {
      return 'RAG_STRATEGIC';
    }

    if (this.hasOperationalContext(normalized)) {
      return 'RAG_OPERATIONAL';
    }

    return 'RAG_OPERATIONAL';
  }

  // Checks for unsafe patterns in the user prompt.
  enforceGuardrails(question: string): void {
    for (const pattern of UNSAFE_PATTERNS) {
      if (pattern.test(question)) {
        throw new AppError(400, 'A pergunta contém conteúdo não permitido. Reformule sua consulta.');
      }
    }
  }

  // Validates question and returns the trimmed value.
  private validateAndNormalizeQuestion(question: unknown): string {
    if (!question || typeof question !== 'string') {
      throw new AppError(400, 'Informe uma pergunta para o agente.');
    }

    const normalized = question.trim();

    if (!normalized) {
      throw new AppError(400, 'Informe uma pergunta para o agente.');
    }

    if (normalized.length > 2000) {
      throw new AppError(400, 'A pergunta deve ter no máximo 2000 caracteres.');
    }

    return normalized;
  }

  // Checks whether the question matches SQL/KPI intent.
  private isSqlIntentQuestion(question: string): boolean {
    return SQL_INTENT_KEYWORDS.some((keyword) => question.includes(keyword));
  }

  // Checks whether the question has strategic context.
  private hasStrategicContext(question: string): boolean {
    return STRATEGIC_INTENT_KEYWORDS.some((keyword) => question.includes(keyword));
  }

  // Checks whether the question has operational context.
  private hasOperationalContext(question: string): boolean {
    return OPERATIONAL_INTENT_KEYWORDS.some((keyword) => question.includes(keyword));
  }

  // Executes SQL analytics route.
  private async executeSqlRoute(
    input: AgentAskInput,
    context: McpCorrelationContext,
  ): Promise<SqlAnalyticsOutput> {
    const result = await this.mcpServer.executeTool(
      {
        tool: 'sql_analytics_query',
        input: {
          question: input.question,
          dateRange: input.dateRange,
        },
      },
      context,
    );

    return result as SqlAnalyticsOutput;
  }

  // Executes RAG operational route.
  private async executeRagOperationalRoute(
    input: AgentAskInput,
    context: McpCorrelationContext,
  ): Promise<RagOperationalOutput> {
    const result = await this.mcpServer.executeTool(
      {
        tool: 'rag_operational_search',
        input: {
          query: input.question,
          topK: input.topK,
          entityTypes: input.entityTypes,
        },
      },
      context,
    );

    return result as RagOperationalOutput;
  }

  // Executes RAG strategic route.
  private async executeRagStrategicRoute(
    input: AgentAskInput,
    context: McpCorrelationContext,
  ): Promise<RagStrategicOutput> {
    const result = await this.mcpServer.executeTool(
      {
        tool: 'rag_strategic_search',
        input: {
          query: input.question,
          topK: input.topK,
          topicFilters: input.entityTypes,
        },
      },
      context,
    );

    return result as RagStrategicOutput;
  }

  // Executes hybrid route combining SQL + RAG.
  private async executeHybridRoute(
    input: AgentAskInput,
    context: McpCorrelationContext,
  ): Promise<HybridMergeOutput> {
    const result = await this.mcpServer.executeTool(
      {
        tool: 'hybrid_context_merge',
        input: {
          question: input.question,
          dateRange: input.dateRange,
          topK: input.topK,
          entityTypes: input.entityTypes,
        },
      },
      context,
    );

    return result as HybridMergeOutput;
  }

  // Formats SQL analytics result into a readable response.
  private formatSqlResponse(result: SqlAnalyticsOutput): string {
    if (result.rowCount === 0) {
      return 'Nenhum dado encontrado para a consulta informada.';
    }

    const lines: string[] = [`**${result.queryDescription}**\n`];

    for (const row of result.rows) {
      const entries = Object.entries(row)
        .map(([key, value]) => `${this.formatColumnName(key)}: ${this.formatValue(value)}`)
        .join(' | ');
      lines.push(`- ${entries}`);
    }

    return lines.join('\n');
  }

  // Formats RAG operational result into a readable response.
  private formatRagResponse(result: RagOperationalOutput): string {
    if (result.totalFound === 0) {
      return 'Nenhum documento encontrado para a pesquisa informada.';
    }

    const lines: string[] = [`Encontrados ${result.totalFound} resultado(s):\n`];

    for (const doc of result.results) {
      lines.push(`- [${doc.entityType}] ${doc.snippet} (relevância: ${(doc.score * 100).toFixed(1)}%)`);
    }

    return lines.join('\n');
  }

  // Formats RAG strategic result into a readable response.
  private formatStrategicResponse(result: RagStrategicOutput): string {
    if (result.totalFound === 0) {
      return 'Nenhum documento estratégico encontrado para a pesquisa informada.';
    }

    const lines: string[] = [`Encontrados ${result.totalFound} resultado(s) estratégico(s):\n`];

    for (const doc of result.results) {
      lines.push(`- [${doc.entityType}] ${doc.snippet} (relevância: ${(doc.score * 100).toFixed(1)}%)`);
    }

    return lines.join('\n');
  }

  // Formats hybrid merge result into a readable response.
  private formatHybridResponse(result: HybridMergeOutput): string {
    if (result.blocks.length === 0) {
      return 'Nenhum dado encontrado para a consulta híbrida.';
    }

    const lines: string[] = ['**Resultado combinado (SQL + RAG)**\n'];

    for (const block of result.blocks) {
      const sourceLabel = block.source === 'sql_analytics_query' ? 'SQL' : 'RAG';
      const confidence = (block.confidence * 100).toFixed(1);
      lines.push(`- [${sourceLabel}] ${block.content.slice(0, 300)} (confiança: ${confidence}%)`);
    }

    return lines.join('\n');
  }

  // Extracts source references from SQL analytics output.
  private extractSqlSources(result: SqlAnalyticsOutput): AgentSourceRef[] {
    return [{
      tipo: 'sql',
      id: 'sql_analytics',
      titulo: result.queryDescription,
    }];
  }

  // Extracts source references from RAG operational output.
  private extractRagSources(result: RagOperationalOutput): AgentSourceRef[] {
    return result.results.map((doc) => ({
      tipo: doc.entityType,
      id: doc.entityId,
      titulo: doc.snippet.slice(0, 100),
      score: doc.score,
    }));
  }

  // Extracts source references from RAG strategic output.
  private extractRagStrategicSources(result: RagStrategicOutput): AgentSourceRef[] {
    return result.results.map((doc) => ({
      tipo: doc.entityType,
      id: doc.entityId,
      titulo: doc.snippet.slice(0, 100),
      score: doc.score,
    }));
  }

  // Extracts source references from hybrid merge output.
  private extractHybridSources(result: HybridMergeOutput): AgentSourceRef[] {
    return result.blocks.map((block, index) => ({
      tipo: block.source === 'sql_analytics_query' ? 'sql' : 'rag',
      id: `hybrid_block_${index}`,
      titulo: block.content.slice(0, 100),
      score: block.confidence,
    }));
  }

  // Formats a database column name to a human-readable label.
  private formatColumnName(column: string): string {
    return column.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  // Formats a value for display, handling null and number cases.
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') return value.toLocaleString('pt-BR');
    return String(value);
  }
}
