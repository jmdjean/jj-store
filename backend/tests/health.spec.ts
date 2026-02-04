import request from 'supertest';
import { createApp } from '../src/app.js';

describe('GET /health', () => {
  it('returns bootstrap health response in pt-BR', async () => {
    const app = createApp();

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      mensagem: 'Serviço online',
    });
  });
});
