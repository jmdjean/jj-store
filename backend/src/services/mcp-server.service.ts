import { randomUUID } from 'node:crypto';
import { AppError } from '../common/app-error.js';
import { env } from '../config/env.js';
import type {
  McpToolName,
  McpToolOutput,
  SqlAnalyticsInput,
  RagOperationalInput,
  RagStrategicInput,
  HybridMergeInput,
  McpCorrelationContext,
} from './mcp.types.js';
import { McpToolsService } from './mcp-tools.service.js';

type McpToolRequest = {
  tool: McpToolName;
  input: Record<string, unknown>;
};

type McpLogger = {
  info: (payload: Record<string, unknown>) => void;
  error: (payload: Record<string, unknown>) => void;
};

export class McpServerService {
  private readonly logger: McpLogger;

  constructor(private readonly mcpToolsService: McpToolsService) {
    this.logger = {
      info: (payload) => console.info(JSON.stringify(payload)),
      error: (payload) => console.error(JSON.stringify(payload)),
    };
  }

  // Validates service token or signed context for MCP server auth.
  validateServiceAuth(serviceToken?: string): void {
    const expectedToken = env.mcpServiceToken;

    if (!expectedToken) {
      return;
    }

    if (!serviceToken || serviceToken !== expectedToken) {
      throw new AppError(403, 'Token de serviço MCP inválido.');
    }
  }

  // Creates a new correlation context for tracking the full request chain.
  createCorrelationContext(actorUserId: string, actorRole: string): McpCorrelationContext {
    return {
      correlationId: randomUUID(),
      actorUserId,
      actorRole,
      startedAt: Date.now(),
    };
  }

  // Dispatches a tool request to the appropriate MCP tool executor.
  async executeTool(
    request: McpToolRequest,
    context: McpCorrelationContext,
  ): Promise<McpToolOutput> {
    this.logger.info({
      event: 'mcp_tool_dispatch',
      correlationId: context.correlationId,
      tool: request.tool,
      actorUserId: context.actorUserId,
    });

    switch (request.tool) {
      case 'sql_analytics_query':
        return this.mcpToolsService.executeSqlAnalytics(
          request.input as SqlAnalyticsInput,
          context,
        );

      case 'rag_operational_search':
        return this.mcpToolsService.executeRagOperational(
          request.input as RagOperationalInput,
          context,
        );

      case 'rag_strategic_search':
        return this.mcpToolsService.executeRagStrategic(
          request.input as RagStrategicInput,
          context,
        );

      case 'hybrid_context_merge':
        return this.mcpToolsService.executeHybridMerge(
          request.input as HybridMergeInput,
          context,
        );

      default:
        throw new AppError(400, `Ferramenta MCP desconhecida: ${request.tool as string}`);
    }
  }

  // Executes multiple tools in sequence and returns all results.
  async executeToolChain(
    requests: McpToolRequest[],
    context: McpCorrelationContext,
  ): Promise<McpToolOutput[]> {
    const results: McpToolOutput[] = [];

    for (const request of requests) {
      const result = await this.executeTool(request, context);
      results.push(result);
    }

    return results;
  }
}
