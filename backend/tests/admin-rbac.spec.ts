import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';

describe('GET /admin/painel', () => {
  it('retorna 401 quando nao envia token', async () => {
    const app = createApp();

    const response = await request(app).get('/admin/painel');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      mensagem: 'Token de autenticação não informado.',
    });
  });

  it('retorna 403 quando usuario nao tem role permitida', async () => {
    const app = createApp();
    const customerToken = jwt.sign(
      {
        sub: 'cliente-1',
        role: 'CUSTOMER',
        nomeExibicao: 'Cliente',
      },
      env.jwtSecret,
    );

    const response = await request(app)
      .get('/admin/painel')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      mensagem: 'Você não tem permissão para acessar este recurso.',
    });
  });

  it('retorna 200 para perfis ADMIN', async () => {
    const app = createApp();
    const adminToken = jwt.sign(
      {
        sub: 'admin-1',
        role: 'ADMIN',
        nomeExibicao: 'Admin',
      },
      env.jwtSecret,
    );

    const response = await request(app)
      .get('/admin/painel')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      mensagem: 'Painel administrativo liberado.',
    });
  });
});
