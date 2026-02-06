import type { NextFunction, Request, Response } from 'express';
import { RagSyncService, type RagSearchInput } from '../services/rag-sync.service.js';

export class RagController {
  constructor(private readonly ragSyncService: RagSyncService) {}

  // Handles semantic search requests for admin and manager users.
  async search(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const payload = request.body as RagSearchInput;
      const result = await this.ragSyncService.search(payload);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
