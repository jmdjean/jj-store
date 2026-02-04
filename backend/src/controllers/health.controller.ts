import type { Request, Response } from 'express';
import { HealthService } from '../services/health.service.js';

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // Handles health-check requests and returns service status.
  getHealth(_request: Request, response: Response): void {
    response.json(this.healthService.getHealth());
  }
}