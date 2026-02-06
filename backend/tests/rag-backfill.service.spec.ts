import { jest } from '@jest/globals';
import { AppError } from '../src/common/app-error.js';
import {
  RagBackfillService,
  type RagBackfillInput,
  type RagReprocessInput,
} from '../src/services/rag-backfill.service.js';
import type { RagBackfillRepository } from '../src/repositories/rag-backfill.repository.js';
import type {
  RagRepository,
  ProductRagSource,
  CustomerRagSource,
  OrderRagSource,
  OrderItemRagSource,
} from '../src/repositories/rag.repository.js';
import type { RagSyncService } from '../src/services/rag-sync.service.js';

const PRODUCT_UUID = '9f643c37-0d6c-4f8b-9c50-22c7c8b2a7d1';
const CUSTOMER_UUID = 'a2b4c6d8-1234-5678-9abc-def012345678';
const ORDER_UUID = 'b3c5d7e9-2345-6789-abcd-ef0123456789';

const buildProduct = (overrides?: Partial<ProductRagSource>): ProductRagSource => ({
  id: PRODUCT_UUID,
  name: 'Produto teste',
  description: 'Descrição do produto',
  category: 'Categoria',
  price_cents: 1000,
  weight_grams: 500,
  is_active: true,
  stock_quantity: 10,
  updated_at: new Date().toISOString(),
  ...overrides,
});

const buildCustomer = (overrides?: Partial<CustomerRagSource>): CustomerRagSource => ({
  user_id: CUSTOMER_UUID,
  full_name: 'Maria Silva',
  cpf: '12345678900',
  email: 'maria@test.com',
  city: 'São Paulo',
  state: 'SP',
  updated_at: new Date().toISOString(),
  ...overrides,
});

const buildOrder = (overrides?: Partial<OrderRagSource>): OrderRagSource => ({
  id: ORDER_UUID,
  customer_id: CUSTOMER_UUID,
  status: 'CONFIRMED',
  total_amount_cents: 5000,
  items_count: 2,
  shipping_city: 'Rio de Janeiro',
  shipping_state: 'RJ',
  updated_at: new Date().toISOString(),
  ...overrides,
});

const buildOrderItem = (overrides?: Partial<OrderItemRagSource>): OrderItemRagSource => ({
  id: 'c4d6e8f0-3456-7890-bcde-f01234567890',
  order_id: ORDER_UUID,
  product_id: PRODUCT_UUID,
  product_name: 'Produto teste',
  product_category: 'Categoria',
  quantity: 2,
  unit_price_cents: 1000,
  line_total_cents: 2000,
  ...overrides,
});

// Builds a service instance with mocked dependencies for testing.
const buildService = () => {
  const ragRepository = {
    countProductsForIndexing: jest.fn(async () => 2),
    countCustomersForIndexing: jest.fn(async () => 0),
    countManagersForIndexing: jest.fn(async () => 0),
    countOrdersForIndexing: jest.fn(async () => 0),
    countOrderItemsForIndexing: jest.fn(async () => 0),
    listProductsForIndexingBatch: jest.fn(async () => []),
    listCustomersForIndexingBatch: jest.fn(async () => []),
    listManagersForIndexingBatch: jest.fn(async () => []),
    listOrdersForIndexingBatch: jest.fn(async () => []),
    listOrderItemsForIndexingBatch: jest.fn(async () => []),
    listOrderItemsForOrders: jest.fn(async () => []),
  } as unknown as RagRepository;

  const ragBackfillRepository = {
    listFailures: jest.fn(async () => []),
    upsertFailure: jest.fn(async () => undefined),
    deleteFailure: jest.fn(async () => undefined),
  } as unknown as RagBackfillRepository;

  const ragSyncService = {
    syncProduct: jest.fn(async () => undefined),
    syncCustomer: jest.fn(async () => undefined),
    syncManager: jest.fn(async () => undefined),
    syncOrder: jest.fn(async () => undefined),
    syncOrderItem: jest.fn(async () => undefined),
  } as unknown as RagSyncService;

  return {
    service: new RagBackfillService(ragRepository, ragBackfillRepository, ragSyncService),
    ragRepository,
    ragBackfillRepository,
    ragSyncService,
  };
};

const defaultInput = (overrides?: Partial<RagBackfillInput>): RagBackfillInput => ({
  entityTypes: ['product'],
  dryRun: false,
  batchSize: 10,
  maxItemAttempts: 1,
  failureAlertThreshold: 0.2,
  ...overrides,
});

describe('rag-backfill.service | unit', () => {
  // --- Dry-run ---

  it('returns counts during dry run without syncing', async () => {
    const { service, ragSyncService } = buildService();
    const input = defaultInput({ dryRun: true });

    const report = await service.runBackfill(input);

    expect(report.dryRun).toBe(true);
    expect(report.total).toBe(2);
    expect(report.success).toBe(0);
    expect(report.failures).toBe(0);
    expect(report.perEntity.product.total).toBe(2);
    expect(ragSyncService.syncProduct).not.toHaveBeenCalled();
  });

  it('dry run aggregates counts across multiple entity types', async () => {
    const { service, ragRepository } = buildService();
    (ragRepository.countProductsForIndexing as jest.Mock).mockResolvedValue(5);
    (ragRepository.countCustomersForIndexing as jest.Mock).mockResolvedValue(3);

    const input = defaultInput({ entityTypes: ['product', 'customer'], dryRun: true });
    const report = await service.runBackfill(input);

    expect(report.total).toBe(8);
    expect(report.perEntity.product.total).toBe(5);
    expect(report.perEntity.customer.total).toBe(3);
  });

  // --- Batch processing ---

  it('processes products in batches and reports success', async () => {
    const { service, ragRepository, ragSyncService } = buildService();
    const products = [buildProduct(), buildProduct({ id: 'aaa-bbb-ccc' })];
    (ragRepository.listProductsForIndexingBatch as jest.Mock).mockResolvedValueOnce(products);

    const input = defaultInput({ batchSize: 50 });
    const report = await service.runBackfill(input);

    expect(report.success).toBe(2);
    expect(report.failures).toBe(0);
    expect(ragSyncService.syncProduct).toHaveBeenCalledTimes(2);
    expect(report.perEntity.product.success).toBe(2);
  });

  it('processes customers in batches and reports success', async () => {
    const { service, ragRepository, ragSyncService } = buildService();
    const customers = [buildCustomer()];
    (ragRepository.countCustomersForIndexing as jest.Mock).mockResolvedValue(1);
    (ragRepository.listCustomersForIndexingBatch as jest.Mock).mockResolvedValueOnce(customers);

    const input = defaultInput({ entityTypes: ['customer'] });
    const report = await service.runBackfill(input);

    expect(report.success).toBe(1);
    expect(ragSyncService.syncCustomer).toHaveBeenCalledTimes(1);
    expect(report.perEntity.customer.success).toBe(1);
  });

  it('processes orders with associated items', async () => {
    const { service, ragRepository, ragSyncService } = buildService();
    const orders = [buildOrder()];
    const items = [buildOrderItem()];
    (ragRepository.countOrdersForIndexing as jest.Mock).mockResolvedValue(1);
    (ragRepository.listOrdersForIndexingBatch as jest.Mock).mockResolvedValueOnce(orders);
    (ragRepository.listOrderItemsForOrders as jest.Mock).mockResolvedValue(items);

    const input = defaultInput({ entityTypes: ['order'] });
    const report = await service.runBackfill(input);

    expect(report.success).toBe(1);
    expect(ragSyncService.syncOrder).toHaveBeenCalledTimes(1);
  });

  it('pages through multiple batches', async () => {
    const { service, ragRepository, ragSyncService } = buildService();
    const batch1 = [buildProduct({ id: 'id-1' }), buildProduct({ id: 'id-2' })];
    const batch2 = [buildProduct({ id: 'id-3' })];
    (ragRepository.countProductsForIndexing as jest.Mock).mockResolvedValue(3);
    (ragRepository.listProductsForIndexingBatch as jest.Mock)
      .mockResolvedValueOnce(batch1)
      .mockResolvedValueOnce(batch2);

    const input = defaultInput({ batchSize: 2 });
    const report = await service.runBackfill(input);

    expect(report.total).toBe(3);
    expect(report.success).toBe(3);
    expect(ragSyncService.syncProduct).toHaveBeenCalledTimes(3);
  });

  // --- Idempotency ---

  it('is idempotent - safe to rerun (upsert semantics)', async () => {
    const { service, ragRepository, ragSyncService } = buildService();
    const products = [buildProduct()];
    (ragRepository.listProductsForIndexingBatch as jest.Mock).mockResolvedValue(products);

    const input = defaultInput();
    await service.runBackfill(input);
    await service.runBackfill(input);

    expect(ragSyncService.syncProduct).toHaveBeenCalledTimes(4);
  });

  // --- Failure handling ---

  it('records failure when sync throws and continues processing', async () => {
    const { service, ragRepository, ragBackfillRepository, ragSyncService } = buildService();
    const products = [buildProduct({ id: 'ok-id' }), buildProduct({ id: 'fail-id' })];
    (ragRepository.listProductsForIndexingBatch as jest.Mock).mockResolvedValueOnce(products);
    (ragSyncService.syncProduct as jest.Mock)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('embedding timeout'));

    const input = defaultInput();
    const report = await service.runBackfill(input);

    expect(report.success).toBe(1);
    expect(report.failures).toBe(1);
    expect(ragBackfillRepository.upsertFailure).toHaveBeenCalledWith(
      'product',
      'fail-id',
      'embedding timeout',
      false,
    );
  });

  it('classifies 4xx AppErrors as permanent failures', async () => {
    const { service, ragRepository, ragBackfillRepository, ragSyncService } = buildService();
    const products = [buildProduct()];
    (ragRepository.listProductsForIndexingBatch as jest.Mock).mockResolvedValueOnce(products);
    (ragSyncService.syncProduct as jest.Mock).mockRejectedValue(
      new AppError(404, 'Produto não encontrado.'),
    );

    const input = defaultInput();
    await service.runBackfill(input);

    expect(ragBackfillRepository.upsertFailure).toHaveBeenCalledWith(
      'product',
      PRODUCT_UUID,
      'Produto não encontrado.',
      true,
    );
  });

  it('classifies 5xx AppErrors as transient failures', async () => {
    const { service, ragRepository, ragBackfillRepository, ragSyncService } = buildService();
    const products = [buildProduct()];
    (ragRepository.listProductsForIndexingBatch as jest.Mock).mockResolvedValueOnce(products);
    (ragSyncService.syncProduct as jest.Mock).mockRejectedValue(
      new AppError(500, 'Falha na geração de embeddings.'),
    );

    const input = defaultInput();
    await service.runBackfill(input);

    expect(ragBackfillRepository.upsertFailure).toHaveBeenCalledWith(
      'product',
      PRODUCT_UUID,
      'Falha na geração de embeddings.',
      false,
    );
  });

  // --- Alert threshold ---

  it('logs warning when failure rate exceeds threshold', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { service, ragRepository, ragSyncService } = buildService();
    const products = [buildProduct({ id: 'p1' }), buildProduct({ id: 'p2' })];
    (ragRepository.listProductsForIndexingBatch as jest.Mock).mockResolvedValueOnce(products);
    (ragSyncService.syncProduct as jest.Mock).mockRejectedValue(new Error('fail'));

    const input = defaultInput({ failureAlertThreshold: 0.1 });
    await service.runBackfill(input);

    expect(warnSpy).toHaveBeenCalled();
    const logged = JSON.parse(warnSpy.mock.calls[0][0] as string);
    expect(logged.evento).toBe('rag_backfill_alerta');
    warnSpy.mockRestore();
  });

  it('does not log warning when failure rate is below threshold', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { service, ragRepository, ragSyncService } = buildService();
    const products = [buildProduct({ id: 'p1' }), buildProduct({ id: 'p2' })];
    (ragRepository.listProductsForIndexingBatch as jest.Mock).mockResolvedValueOnce(products);
    (ragSyncService.syncProduct as jest.Mock)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('fail'));

    const input = defaultInput({ failureAlertThreshold: 0.9 });
    await service.runBackfill(input);

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  // --- Report shape ---

  it('returns complete report with timing information', async () => {
    const { service } = buildService();
    const input = defaultInput({ dryRun: true });
    const report = await service.runBackfill(input);

    expect(report).toMatchObject({
      dryRun: true,
      total: expect.any(Number),
      success: expect.any(Number),
      failures: expect.any(Number),
      startedAt: expect.any(Date),
      finishedAt: expect.any(Date),
      elapsedMs: expect.any(Number),
    });
    expect(report.finishedAt.getTime()).toBeGreaterThanOrEqual(report.startedAt.getTime());
  });

  it('report contains per-entity breakdown for all entity types', async () => {
    const { service } = buildService();
    const input = defaultInput({
      entityTypes: ['product', 'customer', 'manager', 'order', 'order_item'],
      dryRun: true,
    });
    const report = await service.runBackfill(input);

    expect(report.perEntity).toHaveProperty('product');
    expect(report.perEntity).toHaveProperty('customer');
    expect(report.perEntity).toHaveProperty('manager');
    expect(report.perEntity).toHaveProperty('order');
    expect(report.perEntity).toHaveProperty('order_item');
  });

  // --- Empty data ---

  it('handles zero records gracefully', async () => {
    const { service, ragRepository } = buildService();
    (ragRepository.countProductsForIndexing as jest.Mock).mockResolvedValue(0);

    const input = defaultInput();
    const report = await service.runBackfill(input);

    expect(report.total).toBe(0);
    expect(report.success).toBe(0);
    expect(report.failures).toBe(0);
  });

  // --- Failure reprocessing ---

  it('reprocesses failures and clears them on success', async () => {
    const { service, ragRepository, ragBackfillRepository, ragSyncService } = buildService();
    (ragBackfillRepository.listFailures as jest.Mock).mockResolvedValue([
      {
        entity_type: 'product' as const,
        entity_id: PRODUCT_UUID,
        failure_count: 1,
        last_error: 'Erro anterior',
        is_permanent: false,
        last_attempt_at: new Date().toISOString(),
      },
    ]);
    (ragRepository.listProductsForIndexingBatch as jest.Mock).mockResolvedValue([buildProduct()]);

    const input: RagReprocessInput = {
      entityType: 'product',
      includePermanent: false,
      limit: 10,
      maxItemAttempts: 1,
    };

    const report = await service.reprocessFailures(input);

    expect(report.total).toBe(1);
    expect(report.success).toBe(1);
    expect(report.failures).toBe(0);
    expect(ragSyncService.syncProduct).toHaveBeenCalledTimes(1);
    expect(ragBackfillRepository.deleteFailure).toHaveBeenCalledWith('product', PRODUCT_UUID);
  });

  it('reprocessing records failure when entity not found', async () => {
    const { service, ragRepository, ragBackfillRepository } = buildService();
    (ragBackfillRepository.listFailures as jest.Mock).mockResolvedValue([
      {
        entity_type: 'product' as const,
        entity_id: PRODUCT_UUID,
        failure_count: 1,
        last_error: 'Erro anterior',
        is_permanent: false,
        last_attempt_at: new Date().toISOString(),
      },
    ]);
    (ragRepository.listProductsForIndexingBatch as jest.Mock).mockResolvedValue([]);

    const input: RagReprocessInput = {
      entityType: 'product',
      includePermanent: false,
      limit: 10,
      maxItemAttempts: 1,
    };

    const report = await service.reprocessFailures(input);

    expect(report.total).toBe(1);
    expect(report.success).toBe(0);
    expect(report.failures).toBe(1);
    expect(ragBackfillRepository.upsertFailure).toHaveBeenCalled();
  });

  it('reprocessing keeps failure record when sync fails again', async () => {
    const { service, ragRepository, ragBackfillRepository, ragSyncService } = buildService();
    (ragBackfillRepository.listFailures as jest.Mock).mockResolvedValue([
      {
        entity_type: 'product' as const,
        entity_id: PRODUCT_UUID,
        failure_count: 2,
        last_error: 'Erro anterior',
        is_permanent: false,
        last_attempt_at: new Date().toISOString(),
      },
    ]);
    (ragRepository.listProductsForIndexingBatch as jest.Mock).mockResolvedValue([buildProduct()]);
    (ragSyncService.syncProduct as jest.Mock).mockRejectedValue(new Error('Ainda falhando'));

    const input: RagReprocessInput = {
      entityType: 'product',
      maxItemAttempts: 1,
    };

    const report = await service.reprocessFailures(input);

    expect(report.failures).toBe(1);
    expect(ragBackfillRepository.deleteFailure).not.toHaveBeenCalled();
    expect(ragBackfillRepository.upsertFailure).toHaveBeenCalledWith(
      'product',
      PRODUCT_UUID,
      'Ainda falhando',
      false,
    );
  });

  it('reprocesses order failures with associated items', async () => {
    const { service, ragRepository, ragBackfillRepository, ragSyncService } = buildService();
    (ragBackfillRepository.listFailures as jest.Mock).mockResolvedValue([
      {
        entity_type: 'order' as const,
        entity_id: ORDER_UUID,
        failure_count: 1,
        last_error: 'Timeout',
        is_permanent: false,
        last_attempt_at: new Date().toISOString(),
      },
    ]);
    (ragRepository.listOrdersForIndexingBatch as jest.Mock).mockResolvedValue([buildOrder()]);
    (ragRepository.listOrderItemsForOrders as jest.Mock).mockResolvedValue([buildOrderItem()]);

    const input: RagReprocessInput = {
      entityType: 'order',
      maxItemAttempts: 1,
    };

    const report = await service.reprocessFailures(input);

    expect(report.success).toBe(1);
    expect(ragSyncService.syncOrder).toHaveBeenCalledTimes(1);
    expect(ragBackfillRepository.deleteFailure).toHaveBeenCalledWith('order', ORDER_UUID);
  });

  // --- No failures to reprocess ---

  it('returns empty report when no failures exist', async () => {
    const { service } = buildService();
    const input: RagReprocessInput = { maxItemAttempts: 1 };
    const report = await service.reprocessFailures(input);

    expect(report.total).toBe(0);
    expect(report.success).toBe(0);
    expect(report.failures).toBe(0);
  });
});
