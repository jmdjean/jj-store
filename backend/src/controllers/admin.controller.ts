import type { Request, Response } from 'express';
import { AdminService } from '../services/admin.service.js';

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Retrieves administrative panel data for dashboard display.
  getPainel(_request: Request, response: Response): void {
    response.status(200).json(this.adminService.getPainelData());
  }
}
