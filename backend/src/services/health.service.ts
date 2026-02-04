import type { HealthResponse } from './health.types.js';
import { HealthRepository } from '../repositories/health.repository.js';

export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  // Returns the API health payload from repository data.
  getHealth(): HealthResponse {
    return this.healthRepository.getHealthData();
  }
}