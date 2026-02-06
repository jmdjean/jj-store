import { AppError } from '../src/common/app-error.js';
import type { QueryExecutor } from '../src/config/database.js';
import { CartService } from '../src/services/cart.service.js';
import type { CartRepository } from '../src/repositories/cart.repository.js';
import type { RagSyncService } from '../src/services/rag-sync.service.js';

describe('CartService', () => {
  const fakeQuery: QueryExecutor = async () => [];

  const createTransactionRunner = () => async <T>(
    callback: (query: QueryExecutor) => Promise<T>,
  ): Promise<T> => callback(fakeQuery);

  it('cria pedido com sucesso e retorna orderId', async () => {
    const repository: CartRepository = {
      findCustomerAddress: async () => ({
        street: 'Rua das Flores',
        streetNumber: '123',
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'PR',
        postalCode: '80000000',
        complement: null,
      }),
      lockProductsForCheckout: async () => [
        {
          id: 'produto-1',
          name: 'Cafeteira Prime',
          category: 'Eletroportáteis',
          priceCents: 79990,
          availableQuantity: 4,
        },
      ],
      createOrder: async () => 'pedido-1',
      createOrderItem: async () => 'item-1',
      decrementInventory: async () => true,
      upsertRagDocument: async () => undefined,
    } as CartRepository;

    const ragSyncService: RagSyncService = {
      syncOrder: async () => undefined,
      syncOrderItem: async () => undefined,
    } as RagSyncService;

    const service = new CartService(repository, createTransactionRunner(), ragSyncService);

    const response = await service.checkout('cliente-1', {
      items: [{ productId: 'produto-1', quantity: 2 }],
    });

    expect(response).toEqual({
      mensagem: 'Pedido criado com sucesso.',
      orderId: 'pedido-1',
    });
  });

  it('retorna erro 404 quando produto nao existe', async () => {
    const repository: CartRepository = {
      findCustomerAddress: async () => ({
        street: 'Rua das Flores',
        streetNumber: '123',
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'PR',
        postalCode: '80000000',
        complement: null,
      }),
      lockProductsForCheckout: async () => [],
      createOrder: async () => 'pedido-1',
      createOrderItem: async () => 'item-1',
      decrementInventory: async () => true,
      upsertRagDocument: async () => undefined,
    } as CartRepository;

    const ragSyncService: RagSyncService = {
      syncOrder: async () => undefined,
      syncOrderItem: async () => undefined,
    } as RagSyncService;

    const service = new CartService(repository, createTransactionRunner(), ragSyncService);

    await expect(
      service.checkout('cliente-1', {
        items: [{ productId: 'nao-existe', quantity: 1 }],
      }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 404,
      mensagem: 'Produto não encontrado.',
    });
  });

  it('retorna erro 409 quando quantidade solicitada supera estoque', async () => {
    const repository: CartRepository = {
      findCustomerAddress: async () => ({
        street: 'Rua das Flores',
        streetNumber: '123',
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'PR',
        postalCode: '80000000',
        complement: null,
      }),
      lockProductsForCheckout: async () => [
        {
          id: 'produto-1',
          name: 'Cafeteira Prime',
          category: 'Eletroportáteis',
          priceCents: 79990,
          availableQuantity: 1,
        },
      ],
      createOrder: async () => 'pedido-1',
      createOrderItem: async () => 'item-1',
      decrementInventory: async () => true,
      upsertRagDocument: async () => undefined,
    } as CartRepository;

    const ragSyncService: RagSyncService = {
      syncOrder: async () => undefined,
      syncOrderItem: async () => undefined,
    } as RagSyncService;

    const service = new CartService(repository, createTransactionRunner(), ragSyncService);

    await expect(
      service.checkout('cliente-1', {
        items: [{ productId: 'produto-1', quantity: 2 }],
      }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 409,
      mensagem: 'Estoque insuficiente para o produto Cafeteira Prime.',
    });
  });
});
