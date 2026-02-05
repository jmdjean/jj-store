import type { QueryExecutor } from '../src/config/database.js';
import { AppError } from '../src/common/app-error.js';
import { AdminService } from '../src/services/admin.service.js';
import type { AdminRepository, AdminProductSnapshot } from '../src/repositories/admin.repository.js';

const baseProduct: AdminProductSnapshot = {
  id: 'produto-1',
  slug: 'cafeteira-prime',
  name: 'Cafeteira Prime',
  description: 'Cafeteira para espresso',
  category: 'Eletroportáteis',
  imageUrl: 'https://example.com/cafeteira.jpg',
  purchasePriceCents: 45000,
  salePriceCents: 79990,
  weightGrams: 3200,
  stockQuantity: 8,
  isActive: true,
  createdAt: new Date('2025-01-10T10:00:00.000Z'),
  updatedAt: new Date('2025-01-10T10:00:00.000Z'),
};

describe('AdminService', () => {
  // Builds a minimal transaction runner that executes callback with a mock query.
  function createTransactionRunner(): (
    callback: (query: QueryExecutor) => Promise<unknown>,
  ) => Promise<unknown> {
    const query = (async () => []) as QueryExecutor;

    return async (callback) => callback(query);
  }

  it('cria produto com auditoria e sincronizacao RAG', async () => {
    let auditLogCalls = 0;
    let upsertRagCalls = 0;

    const repository: Pick<
      AdminRepository,
      | 'getPainelData'
      | 'listProducts'
      | 'findProductById'
      | 'slugExists'
      | 'createProduct'
      | 'updateProduct'
      | 'deactivateProduct'
      | 'insertAuditLog'
      | 'upsertRagDocument'
      | 'deleteRagDocument'
    > = {
      getPainelData: () => ({ mensagem: 'ok' }),
      listProducts: async () => [],
      findProductById: async () => null,
      slugExists: async () => false,
      createProduct: async () => baseProduct,
      updateProduct: async () => null,
      deactivateProduct: async () => null,
      insertAuditLog: async () => {
        auditLogCalls += 1;
      },
      upsertRagDocument: async () => {
        upsertRagCalls += 1;
      },
      deleteRagDocument: async () => undefined,
    };

    const service = new AdminService(repository as AdminRepository, createTransactionRunner() as never);

    const response = await service.createProduct('admin-1', {
      name: 'Cafeteira Prime',
      description: 'Cafeteira para espresso',
      category: 'Eletroportáteis',
      quantity: 8,
      weightGrams: 3200,
      purchasePrice: 450,
      salePrice: 799.9,
      imageUrl: 'https://example.com/cafeteira.jpg',
    });

    expect(response.mensagem).toBe('Produto cadastrado com sucesso.');
    expect(response.data.salePrice).toBe(799.9);
    expect(auditLogCalls).toBe(1);
    expect(upsertRagCalls).toBe(1);
  });

  it('retorna erro quando quantidade for invalida', async () => {
    const repository: Pick<
      AdminRepository,
      | 'getPainelData'
      | 'listProducts'
      | 'findProductById'
      | 'slugExists'
      | 'createProduct'
      | 'updateProduct'
      | 'deactivateProduct'
      | 'insertAuditLog'
      | 'upsertRagDocument'
      | 'deleteRagDocument'
    > = {
      getPainelData: () => ({ mensagem: 'ok' }),
      listProducts: async () => [],
      findProductById: async () => null,
      slugExists: async () => false,
      createProduct: async () => baseProduct,
      updateProduct: async () => null,
      deactivateProduct: async () => null,
      insertAuditLog: async () => undefined,
      upsertRagDocument: async () => undefined,
      deleteRagDocument: async () => undefined,
    };

    const service = new AdminService(repository as AdminRepository, createTransactionRunner() as never);

    await expect(
      service.createProduct('admin-1', {
        name: 'Cafeteira Prime',
        description: 'Cafeteira para espresso',
        category: 'Eletroportáteis',
        quantity: -1,
        weightGrams: 3200,
        purchasePrice: 450,
        salePrice: 799.9,
        imageUrl: 'https://example.com/cafeteira.jpg',
      }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 400,
      mensagem: 'A quantidade deve ser um número inteiro maior ou igual a zero.',
    });
  });

  it('retorna erro 404 ao atualizar produto inexistente', async () => {
    const repository: Pick<
      AdminRepository,
      | 'getPainelData'
      | 'listProducts'
      | 'findProductById'
      | 'slugExists'
      | 'createProduct'
      | 'updateProduct'
      | 'deactivateProduct'
      | 'insertAuditLog'
      | 'upsertRagDocument'
      | 'deleteRagDocument'
    > = {
      getPainelData: () => ({ mensagem: 'ok' }),
      listProducts: async () => [],
      findProductById: async () => null,
      slugExists: async () => false,
      createProduct: async () => baseProduct,
      updateProduct: async () => null,
      deactivateProduct: async () => null,
      insertAuditLog: async () => undefined,
      upsertRagDocument: async () => undefined,
      deleteRagDocument: async () => undefined,
    };

    const service = new AdminService(repository as AdminRepository, createTransactionRunner() as never);

    await expect(
      service.updateProduct('admin-1', 'produto-1', {
        name: 'Cafeteira Prime Plus',
        description: 'Atualizada',
        category: 'Eletroportáteis',
        quantity: 5,
        weightGrams: 3000,
        purchasePrice: 500,
        salePrice: 900,
      }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 404,
      mensagem: 'Produto não encontrado.',
    });
  });
});
