import type { NextFunction, Request, Response } from 'express';
import { AdminService } from '../services/admin.service.js';
import type { RagSearchInput } from '../services/rag.service.js';

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Retrieves administrative panel data for dashboard display.
  getPainel(_request: Request, response: Response): void {
    response.status(200).json(this.adminService.getPainelData());
  }

  // Performs semantic search in RAG documents for privileged users.
  async searchRag(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const payload = request.body as RagSearchInput;
      const result = await this.adminService.searchRag(payload);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
