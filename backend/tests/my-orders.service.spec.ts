import { AppError } from '../src/common/app-error.js';
import type { QueryExecutor } from '../src/config/database.js';
import type { MyOrdersRepository } from '../src/repositories/my-orders.repository.js';
import { MyOrdersService } from '../src/services/my-orders.service.js';
import type { RagSyncService } from '../src/services/rag-sync.service.js';

describe('MyOrdersService', () => {
  const fakeQuery: QueryExecutor = async () => [];

  const createQueryRunner = () => async <T>() => [] as T[];

  const createTransactionRunner = () => async <T>(
    callback: (query: QueryExecutor) => Promise<T>,
  ): Promise<T> => callback(fakeQuery);
  const createRagSyncService = (): RagSyncService =>
    ({
      syncOrder: async () => undefined,
      syncOrderItem: async () => undefined,
    }) as RagSyncService;

  it('lista pedidos paginados com metadados', async () => {
    const repository: MyOrdersRepository = {
      listOrders: async () => [
        {
          id: 'pedido-1',
          status: 'CREATED',
          currencyCode: 'BRL',
          totalAmountCents: 15000,
          itemsCount: 2,
          shippingStreet: 'Rua A',
          shippingStreetNumber: '10',
          shippingNeighborhood: 'Centro',
          shippingCity: 'São Paulo',
          shippingState: 'SP',
          shippingPostalCode: '01001000',
          shippingComplement: null,
          createdAt: new Date(Date.now() - 1000),
          updatedAt: new Date(),
        },
      ],
      countOrders: async () => 1,
      findOrderById: async () => null,
      listOrderItems: async () => [],
      updateOrderStatus: async () => {
        throw new Error('not used');
      },
      restoreInventory: async () => true,
      insertAuditLog: async () => undefined,
      upsertRagDocument: async () => undefined,
    } as MyOrdersRepository;

    const service = new MyOrdersService(
      repository,
      createQueryRunner() as never,
      createTransactionRunner(),
      createRagSyncService(),
    );
    const response = await service.listOrders('cliente-1', { page: 1, pageSize: 10 });

    expect(response.meta).toEqual({
      page: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1,
    });
    expect(response.data[0]?.id).toBe('pedido-1');
    expect(response.data[0]?.canCancel).toBe(true);
  });

  it('cancela pedido elegível e retorna mensagem de sucesso', async () => {
    const createdAt = new Date(Date.now() - 1000 * 60 * 60);
    const repository: MyOrdersRepository = {
      listOrders: async () => [],
      countOrders: async () => 0,
      findOrderById: async () => ({
        id: 'pedido-1',
        status: 'PAID',
        currencyCode: 'BRL',
        totalAmountCents: 5000,
        itemsCount: 1,
        shippingStreet: 'Rua B',
        shippingStreetNumber: '20',
        shippingNeighborhood: 'Centro',
        shippingCity: 'Curitiba',
        shippingState: 'PR',
        shippingPostalCode: '80000000',
        shippingComplement: null,
        createdAt,
        updatedAt: createdAt,
      }),
      listOrderItems: async () => [
        {
          id: 'item-1',
          orderId: 'pedido-1',
          productId: 'produto-1',
          productName: 'Notebook',
          productCategory: 'Eletrônicos',
          unitPriceCents: 5000,
          quantity: 1,
          lineTotalCents: 5000,
        },
      ],
      restoreInventory: async () => true,
      updateOrderStatus: async () => ({
        id: 'pedido-1',
        status: 'CANCELED',
        currencyCode: 'BRL',
        totalAmountCents: 5000,
        itemsCount: 1,
        shippingStreet: 'Rua B',
        shippingStreetNumber: '20',
        shippingNeighborhood: 'Centro',
        shippingCity: 'Curitiba',
        shippingState: 'PR',
        shippingPostalCode: '80000000',
        shippingComplement: null,
        createdAt,
        updatedAt: new Date(),
      }),
      insertAuditLog: async () => undefined,
      upsertRagDocument: async () => undefined,
    } as MyOrdersRepository;

    const service = new MyOrdersService(
      repository,
      createQueryRunner() as never,
      createTransactionRunner(),
      createRagSyncService(),
    );
    const response = await service.cancelOrder('cliente-1', 'pedido-1');

    expect(response).toEqual({
      mensagem: 'Pedido cancelado com sucesso.',
    });
  });

  it('bloqueia cancelamento de pedido entregue', async () => {
    const createdAt = new Date(Date.now() - 1000 * 60 * 60);
    const repository: MyOrdersRepository = {
      listOrders: async () => [],
      countOrders: async () => 0,
      findOrderById: async () => ({
        id: 'pedido-1',
        status: 'DELIVERED',
        currencyCode: 'BRL',
        totalAmountCents: 5000,
        itemsCount: 1,
        shippingStreet: 'Rua B',
        shippingStreetNumber: '20',
        shippingNeighborhood: 'Centro',
        shippingCity: 'Curitiba',
        shippingState: 'PR',
        shippingPostalCode: '80000000',
        shippingComplement: null,
        createdAt,
        updatedAt: createdAt,
      }),
      listOrderItems: async () => [],
      restoreInventory: async () => true,
      updateOrderStatus: async () => {
        throw new Error('not used');
      },
      insertAuditLog: async () => undefined,
      upsertRagDocument: async () => undefined,
    } as MyOrdersRepository;

    const service = new MyOrdersService(
      repository,
      createQueryRunner() as never,
      createTransactionRunner(),
      createRagSyncService(),
    );

    await expect(service.cancelOrder('cliente-1', 'pedido-1')).rejects.toMatchObject<AppError>({
      statusCode: 422,
      mensagem: 'Pedido entregue não pode ser cancelado.',
    });
  });

  it('bloqueia cancelamento quando prazo de 3 dias expirou', async () => {
    const createdAt = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const repository: MyOrdersRepository = {
      listOrders: async () => [],
      countOrders: async () => 0,
      findOrderById: async () => ({
        id: 'pedido-1',
        status: 'SHIPPED',
        currencyCode: 'BRL',
        totalAmountCents: 5000,
        itemsCount: 1,
        shippingStreet: 'Rua B',
        shippingStreetNumber: '20',
        shippingNeighborhood: 'Centro',
        shippingCity: 'Curitiba',
        shippingState: 'PR',
        shippingPostalCode: '80000000',
        shippingComplement: null,
        createdAt,
        updatedAt: createdAt,
      }),
      listOrderItems: async () => [],
      restoreInventory: async () => true,
      updateOrderStatus: async () => {
        throw new Error('not used');
      },
      insertAuditLog: async () => undefined,
      upsertRagDocument: async () => undefined,
    } as MyOrdersRepository;

    const service = new MyOrdersService(
      repository,
      createQueryRunner() as never,
      createTransactionRunner(),
      createRagSyncService(),
    );

    await expect(service.cancelOrder('cliente-1', 'pedido-1')).rejects.toMatchObject<AppError>({
      statusCode: 422,
      mensagem: 'Prazo de cancelamento expirado.',
    });
  });
});
