import type { NextFunction, Request, Response } from 'express';
import { AdminDashboardService } from '../services/admin-dashboard.service.js';

export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  // Handles dashboard summary requests for admin users.
  async getSummary(_request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.adminDashboardService.getSummary();
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
