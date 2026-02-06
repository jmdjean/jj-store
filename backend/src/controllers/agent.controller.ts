import type { NextFunction, Request, Response } from 'express';
import { AgentRouterService } from '../services/agent-router.service.js';
import { McpServerService } from '../services/mcp-server.service.js';
import type { AgentAskInput } from '../services/mcp.types.js';

export class AgentController {
  constructor(
    private readonly agentRouterService: AgentRouterService,
    private readonly mcpServerService: McpServerService,
  ) {}

  // Handles POST /admin/agent/ask requests for agent question routing.
  async ask(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const actorUserId = request.authUser?.id ?? '';
      const actorRole = request.authUser?.role ?? '';

      const context = this.mcpServerService.createCorrelationContext(actorUserId, actorRole);

      const input: AgentAskInput = {
        question: (request.body as Record<string, unknown>).question as string,
        dateRange: (request.body as Record<string, unknown>).dateRange as AgentAskInput['dateRange'],
        topK: (request.body as Record<string, unknown>).topK as number | undefined,
        entityTypes: (request.body as Record<string, unknown>).entityTypes as string[] | undefined,
      };

      const result = await this.agentRouterService.ask(input, context);

      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
