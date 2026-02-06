import type { Request, Response } from 'express';
import { Router } from 'express';
import { HealthController } from '../controllers/health.controller.js';
import { HealthService } from '../services/health.service.js';
import { HealthRepository } from '../repositories/health.repository.js';

const healthRepository = new HealthRepository();
const healthService = new HealthService(healthRepository);
const healthController = new HealthController(healthService);

export const healthRouter = Router();

healthRouter.get('/health', (request: Request, response: Response) => {
  healthController.getHealth(request, response);
});