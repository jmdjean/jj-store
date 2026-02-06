import type { QueryExecutor } from '../src/config/database.js';
import { AppError } from '../src/common/app-error.js';
import { AdminService } from '../src/services/admin.service.js';
import type {
  AdminOrderItemSnapshot,
  AdminOrderSnapshot,
  AdminRepository,
} from '../src/repositories/admin.repository.js';

const baseOrder: AdminOrderSnapshot = {
  id: 'pedido-1',
  customerId: 'cliente-1',
  customerName: 'Maria Souza',
  customerEmail: 'maria@email.com',
  status: 'PAID',
  currencyCode: 'BRL',
  totalAmountCents: 19990,
  itemsCount: 2,
  shippingStreet: 'Rua das Flores',
  shippingStreetNumber: '100',
  shippingNeighborhood: 'Centro',
  shippingCity: 'Curitiba',
  shippingState: 'PR',
  shippingPostalCode: '80000000',
  shippingComplement: null,
  createdAt: new Date('2025-01-15T10:00:00.000Z'),
  updatedAt: new Date('2025-01-15T12:00:00.000Z'),
};

const baseOrderItems: AdminOrderItemSnapshot[] = [
  {
    id: 'item-1',
    orderId: 'pedido-1',
    productId: 'produto-1',
    productName: 'Cafeteira Prime',
    productCategory: 'Eletroportáteis',
    quantity: 1,
    unitPriceCents: 19990,
    lineTotalCents: 19990,
  },
];

describe('AdminService orders', () => {
  // Builds a minimal transaction runner that executes callback with a mock query.
  function createTransactionRunner(): (
    callback: (query: QueryExecutor) => Promise<unknown>,
  ) => Promise<unknown> {
    const query = (async () => []) as QueryExecutor;

    return async (callback) => callback(query);
  }

  it('atualiza status do pedido com auditoria e sincronizacao RAG', async () => {
    let auditLogCalls = 0;
    let upsertRagCalls = 0;

    const repository: Partial<AdminRepository> = {
      getPainelData: () => ({ mensagem: 'ok' }),
      listProducts: async () => [],
      findProductById: async () => null,
      slugExists: async () => false,
      createProduct: async () => {
        throw new Error('not used');
      },
      updateProduct: async () => null,
      deactivateProduct: async () => null,
      deleteRagDocument: async () => undefined,
      listOrders: async () => [baseOrder],
      listOrderItemsByOrderIds: async () => baseOrderItems,
      findOrderById: async () => baseOrder,
      listOrderItems: async () => baseOrderItems,
      updateOrderStatus: async () => ({ ...baseOrder, status: 'PICKING' }),
      insertAuditLog: async () => {
        auditLogCalls += 1;
      },
      upsertRagDocument: async () => {
        upsertRagCalls += 1;
      },
    };

    const service = new AdminService(repository as AdminRepository, createTransactionRunner() as never);

    const response = await service.updateOrderStatus('admin-1', 'pedido-1', {
      status: 'PICKING',
    });

    expect(response.mensagem).toBe('Status do pedido atualizado com sucesso.');
    expect(response.data.status).toBe('PICKING');
    expect(auditLogCalls).toBe(1);
    expect(upsertRagCalls).toBe(1);
  });

  it('retorna erro para transicao invalida de status', async () => {
    const repository: Partial<AdminRepository> = {
      getPainelData: () => ({ mensagem: 'ok' }),
      listProducts: async () => [],
      findProductById: async () => null,
      slugExists: async () => false,
      createProduct: async () => {
        throw new Error('not used');
      },
      updateProduct: async () => null,
      deactivateProduct: async () => null,
      deleteRagDocument: async () => undefined,
      listOrders: async () => [baseOrder],
      listOrderItemsByOrderIds: async () => baseOrderItems,
      findOrderById: async () => ({ ...baseOrder, status: 'DELIVERED' }),
      listOrderItems: async () => baseOrderItems,
      updateOrderStatus: async () => ({ ...baseOrder, status: 'CANCELED' }),
      insertAuditLog: async () => undefined,
      upsertRagDocument: async () => undefined,
    };

    const service = new AdminService(repository as AdminRepository, createTransactionRunner() as never);

    await expect(
      service.updateOrderStatus('admin-1', 'pedido-1', {
        status: 'CANCELED',
      }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 422,
      mensagem: 'Transição de status inválida para este pedido.',
    });
  });
});
