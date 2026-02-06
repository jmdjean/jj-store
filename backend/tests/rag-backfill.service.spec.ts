import { jest } from '@jest/globals';
import { RagBackfillService, type RagBackfillInput, type RagReprocessInput } from '../src/services/rag-backfill.service.js';
import type { RagBackfillRepository } from '../src/repositories/rag-backfill.repository.js';
import type { RagRepository } from '../src/repositories/rag.repository.js';
import type { RagSyncService } from '../src/services/rag-sync.service.js';

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

// Defines the unit test suite for the backfill service.
describe('rag-backfill.service | unit', () => {
  // Validates dry run behavior without invoking sync operations.
  it('returns counts during dry run without syncing', async () => {
    const { service, ragSyncService } = buildService();
    const input: RagBackfillInput = {
      entityTypes: ['product'],
      dryRun: true,
      batchSize: 10,
      maxItemAttempts: 1,
      failureAlertThreshold: 0.2,
    };

    const report = await service.runBackfill(input);

    expect(report.total).toBe(2);
    expect(report.success).toBe(0);
    expect(report.failures).toBe(0);
    expect(report.perEntity.product.total).toBe(2);
    expect(ragSyncService.syncProduct).not.toHaveBeenCalled();
  });

  // Validates failure reprocessing and cleanup on success.
  it('reprocesses failures and clears them on success', async () => {
    const { service, ragRepository, ragBackfillRepository, ragSyncService } = buildService();
    ragBackfillRepository.listFailures = jest.fn(async () => [
      {
        entity_type: 'product',
        entity_id: '9f643c37-0d6c-4f8b-9c50-22c7c8b2a7d1',
        failure_count: 1,
        last_error: 'Erro anterior',
        is_permanent: false,
        last_attempt_at: new Date().toISOString(),
      },
    ]);
    ragRepository.listProductsForIndexingBatch = jest.fn(async () => [
      {
        id: '9f643c37-0d6c-4f8b-9c50-22c7c8b2a7d1',
        name: 'Produto teste',
        description: 'Descrição',
        category: 'Categoria',
        price_cents: 1000,
        weight_grams: 500,
        is_active: true,
        stock_quantity: 10,
        updated_at: new Date().toISOString(),
      },
    ]);

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
    expect(ragBackfillRepository.deleteFailure).toHaveBeenCalledWith(
      'product',
      '9f643c37-0d6c-4f8b-9c50-22c7c8b2a7d1',
    );
  });
});
