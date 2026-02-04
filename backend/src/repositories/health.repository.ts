import type { HealthResponse } from '../services/health.types.js';

export class HealthRepository {
  // Returns static health data for availability checks.
  getHealthData(): HealthResponse {
    return {
      status: 'ok',
      mensagem: 'Serviço online',
    };
  }
}
