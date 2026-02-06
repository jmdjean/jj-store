import { AppError } from '../common/app-error.js';
import { env } from '../config/env.js';
import type {
  CustomerRagSource,
  ManagerRagSource,
  OrderItemRagSource,
  OrderRagSource,
  ProductRagSource,
  RagEntityType,
} from '../repositories/rag.repository.js';
import { RagRepository } from '../repositories/rag.repository.js';
import { RagBackfillRepository } from '../repositories/rag-backfill.repository.js';
import { RagSyncService } from './rag-sync.service.js';

type RagBackfillRangeFilter = {
  fromDate?: string;
  toDate?: string;
  entityId?: string;
};

export type RagBackfillInput = RagBackfillRangeFilter & {
  entityTypes: RagEntityType[];
  dryRun: boolean;
  batchSize: number;
  maxItemAttempts: number;
  failureAlertThreshold: number;
};

export type RagBackfillReport = {
  dryRun: boolean;
  total: number;
  success: number;
  failures: number;
  startedAt: Date;
  finishedAt: Date;
  elapsedMs: number;
  perEntity: Record<RagEntityType, { total: number; success: number; failures: number }>;
};

export type RagReprocessInput = {
  entityType?: RagEntityType;
  includePermanent?: boolean;
  limit?: number;
  maxItemAttempts: number;
};

export type RagReprocessReport = {
  total: number;
  success: number;
  failures: number;
};

export class RagBackfillService {
  // Initializes backfill service dependencies for RAG operations.
  constructor(
    private readonly ragRepository: RagRepository,
    private readonly ragBackfillRepository: RagBackfillRepository,
    private readonly ragSyncService: RagSyncService,
  ) {}

  // Runs a backfill operation across selected entities with batching and retries.
  async runBackfill(input: RagBackfillInput): Promise<RagBackfillReport> {
    const startedAt = new Date();
    const perEntity = this.createEmptyEntityStats();
    let total = 0;
    let success = 0;
    let failures = 0;

    for (const entityType of input.entityTypes) {
      const entityTotal = await this.countEntity(entityType, input);
      total += entityTotal;
      perEntity[entityType].total = entityTotal;

      if (input.dryRun || entityTotal === 0) {
        continue;
      }

      const { entitySuccess, entityFailures } = await this.processEntityBatches(entityType, input);
      perEntity[entityType].success = entitySuccess;
      perEntity[entityType].failures = entityFailures;
      success += entitySuccess;
      failures += entityFailures;
    }

    const finishedAt = new Date();
    const report: RagBackfillReport = {
      dryRun: input.dryRun,
      total,
      success,
      failures,
      startedAt,
      finishedAt,
      elapsedMs: finishedAt.getTime() - startedAt.getTime(),
      perEntity,
    };

    this.checkFailureRate(report, input.failureAlertThreshold);
    return report;
  }

  // Reprocesses failures stored in the dead-letter table with retry handling.
  async reprocessFailures(input: RagReprocessInput): Promise<RagReprocessReport> {
    const failures = await this.ragBackfillRepository.listFailures({
      entityType: input.entityType,
      includePermanent: input.includePermanent,
      limit: input.limit,
    });
    let success = 0;
    let failCount = 0;

    for (const failure of failures) {
      const processed = await this.reprocessFailure(failure.entity_type, failure.entity_id, input);
      if (processed) {
        success += 1;
      } else {
        failCount += 1;
      }
    }

    return {
      total: failures.length,
      success,
      failures: failCount,
    };
  }

  // Processes all batches for a single entity type and returns counters.
  private async processEntityBatches(
    entityType: RagEntityType,
    input: RagBackfillInput,
  ): Promise<{ entitySuccess: number; entityFailures: number }> {
    let offset = 0;
    let entitySuccess = 0;
    let entityFailures = 0;
    const batchSize = input.batchSize;
    const total = await this.countEntity(entityType, input);

    while (offset < total) {
      const batch = await this.loadEntityBatch(entityType, input, batchSize, offset);
      if (batch.length === 0) {
        break;
      }

      const { successCount, failureCount } = await this.processBatch(entityType, batch, input);
      entitySuccess += successCount;
      entityFailures += failureCount;
      offset += batch.length;
    }

    return { entitySuccess, entityFailures };
  }

  // Processes a single batch of entities with proper logging and retry handling.
  private async processBatch(
    entityType: RagEntityType,
    batch:
      | ProductRagSource[]
      | CustomerRagSource[]
      | ManagerRagSource[]
      | OrderRagSource[]
      | OrderItemRagSource[],
    input: RagBackfillInput,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (entityType === 'order') {
      return this.processOrderBatch(batch as OrderRagSource[], input);
    }

    let successCount = 0;
    let failureCount = 0;

    for (const source of batch) {
      const processed = await this.processSingleEntity(entityType, source, input);
      if (processed) {
        successCount += 1;
      } else {
        failureCount += 1;
      }
    }

    return { successCount, failureCount };
  }

  // Processes a batch of orders while loading order items in a single query.
  private async processOrderBatch(
    batch: OrderRagSource[],
    input: RagBackfillInput,
  ): Promise<{ successCount: number; failureCount: number }> {
    const orderIds = batch.map((order) => order.id);
    const orderItems = await this.ragRepository.listOrderItemsForOrders(orderIds);
    const itemsByOrder = this.groupOrderItemsByOrderId(orderItems);
    let successCount = 0;
    let failureCount = 0;

    for (const order of batch) {
      const items = itemsByOrder.get(order.id) ?? [];
      const processed = await this.processOrderEntity(order, items, input);
      if (processed) {
        successCount += 1;
      } else {
        failureCount += 1;
      }
    }

    return { successCount, failureCount };
  }

  // Processes a single entity item and records failures when needed.
  private async processSingleEntity(
    entityType: RagEntityType,
    source:
      | ProductRagSource
      | CustomerRagSource
      | ManagerRagSource
      | OrderRagSource
      | OrderItemRagSource,
    input: RagBackfillInput,
  ): Promise<boolean> {
    if (entityType === 'order') {
      throw new AppError(500, 'Processamento de pedidos deve usar o fluxo dedicado.');
    }

    try {
      await this.attemptSync(entityType, source, input.maxItemAttempts);
      return true;
    } catch (error) {
      await this.recordFailure(entityType, this.extractEntityId(entityType, source), error);
      return false;
    }
  }

  // Processes a single order entity with its associated items.
  private async processOrderEntity(
    order: OrderRagSource,
    items: OrderItemRagSource[],
    input: RagBackfillInput,
  ): Promise<boolean> {
    try {
      await this.attemptOrderSync(order, items, input.maxItemAttempts);
      return true;
    } catch (error) {
      await this.recordFailure('order', order.id, error);
      return false;
    }
  }

  // Attempts to sync a single entity with retries for transient failures.
  private async attemptSync(
    entityType: RagEntityType,
    source:
      | ProductRagSource
      | CustomerRagSource
      | ManagerRagSource
      | OrderRagSource
      | OrderItemRagSource,
    maxAttempts: number,
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.syncEntity(entityType, source);
        return;
      } catch (error) {
        if (attempt === maxAttempts || this.isPermanentFailure(error)) {
          throw error;
        }

        await this.delay(attempt * 125);
      }
    }
  }

  // Attempts to sync an order with retries and associated items.
  private async attemptOrderSync(
    order: OrderRagSource,
    items: OrderItemRagSource[],
    maxAttempts: number,
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.syncOrder(order, items);
        return;
      } catch (error) {
        if (attempt === maxAttempts || this.isPermanentFailure(error)) {
          throw error;
        }

        await this.delay(attempt * 125);
      }
    }
  }

  // Loads the total count for a given entity with filters applied.
  private async countEntity(entityType: RagEntityType, filter: RagBackfillRangeFilter): Promise<number> {
    if (entityType === 'product') {
      return this.ragRepository.countProductsForIndexing(filter);
    }

    if (entityType === 'customer') {
      return this.ragRepository.countCustomersForIndexing(filter);
    }

    if (entityType === 'manager') {
      return this.ragRepository.countManagersForIndexing(filter);
    }

    if (entityType === 'order') {
      return this.ragRepository.countOrdersForIndexing(filter);
    }

    return this.ragRepository.countOrderItemsForIndexing(filter);
  }

  // Loads a batch of entities based on type and filter.
  private async loadEntityBatch(
    entityType: RagEntityType,
    filter: RagBackfillRangeFilter,
    limit: number,
    offset: number,
  ): Promise<
    | ProductRagSource[]
    | CustomerRagSource[]
    | ManagerRagSource[]
    | OrderRagSource[]
    | OrderItemRagSource[]
  > {
    if (entityType === 'product') {
      return this.ragRepository.listProductsForIndexingBatch({ ...filter, limit, offset });
    }

    if (entityType === 'customer') {
      return this.ragRepository.listCustomersForIndexingBatch({ ...filter, limit, offset });
    }

    if (entityType === 'manager') {
      return this.ragRepository.listManagersForIndexingBatch({ ...filter, limit, offset });
    }

    if (entityType === 'order') {
      return this.ragRepository.listOrdersForIndexingBatch({ ...filter, limit, offset });
    }

    return this.ragRepository.listOrderItemsForIndexingBatch({ ...filter, limit, offset });
  }

  // Performs the sync operation for each entity type.
  private async syncEntity(
    entityType: RagEntityType,
    source:
      | ProductRagSource
      | CustomerRagSource
      | ManagerRagSource
      | OrderRagSource
      | OrderItemRagSource,
  ): Promise<void> {
    if (entityType === 'product') {
      await this.syncProduct(source as ProductRagSource);
      return;
    }

    if (entityType === 'customer') {
      await this.syncCustomer(source as CustomerRagSource);
      return;
    }

    if (entityType === 'manager') {
      await this.syncManager(source as ManagerRagSource);
      return;
    }

    if (entityType === 'order_item') {
      await this.syncOrderItem(source as OrderItemRagSource);
    }
  }

  // Upserts a product into the RAG index via the sync service.
  private async syncProduct(product: ProductRagSource): Promise<void> {
    await this.ragSyncService.syncProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      salePriceCents: product.price_cents,
      weightGrams: product.weight_grams,
      stockQuantity: product.stock_quantity,
      isActive: product.is_active,
      updatedAt: product.updated_at,
    });
  }

  // Upserts a customer into the RAG index via the sync service.
  private async syncCustomer(customer: CustomerRagSource): Promise<void> {
    await this.ragSyncService.syncCustomer({
      userId: customer.user_id,
      city: customer.city,
      state: customer.state,
      updatedAt: customer.updated_at,
    });
  }

  // Upserts a manager into the RAG index via the sync service.
  private async syncManager(manager: ManagerRagSource): Promise<void> {
    await this.ragSyncService.syncManager({
      id: manager.id,
      updatedAt: manager.updated_at,
    });
  }

  // Upserts an order into the RAG index via the sync service.
  private async syncOrder(order: OrderRagSource, items: OrderItemRagSource[]): Promise<void> {
    const orderItems = items.map((item) => ({
      id: item.id,
      orderId: item.order_id,
      productId: item.product_id,
      productName: item.product_name,
      productCategory: item.product_category,
      quantity: item.quantity,
      unitPriceCents: item.unit_price_cents,
      lineTotalCents: item.line_total_cents,
    }));

    await this.ragSyncService.syncOrder(
      {
        id: order.id,
        customerId: order.customer_id,
        status: order.status,
        totalAmountCents: order.total_amount_cents,
        itemsCount: order.items_count,
        shippingCity: order.shipping_city,
        shippingState: order.shipping_state,
        updatedAt: order.updated_at,
      },
      orderItems,
    );
  }

  // Upserts an order item into the RAG index via the sync service.
  private async syncOrderItem(item: OrderItemRagSource): Promise<void> {
    await this.ragSyncService.syncOrderItem({
      id: item.id,
      orderId: item.order_id,
      productId: item.product_id,
      productName: item.product_name,
      productCategory: item.product_category,
      quantity: item.quantity,
      unitPriceCents: item.unit_price_cents,
      lineTotalCents: item.line_total_cents,
    });
  }

  // Reprocesses a single failure record and clears it on success.
  private async reprocessFailure(
    entityType: RagEntityType,
    entityId: string,
    input: RagReprocessInput,
  ): Promise<boolean> {
    const sources = await this.loadEntityBatch(
      entityType,
      { entityId },
      1,
      0,
    );
    const source = sources[0];

    if (!source) {
      await this.recordFailure(entityType, entityId, new AppError(404, 'Entidade não encontrada.'));
      return false;
    }

    try {
      if (entityType === 'order') {
        const items = await this.ragRepository.listOrderItemsForOrders([entityId]);
        await this.attemptOrderSync(source as OrderRagSource, items, input.maxItemAttempts);
      } else {
        await this.attemptSync(entityType, source, input.maxItemAttempts);
      }

      await this.ragBackfillRepository.deleteFailure(entityType, entityId);
      return true;
    } catch (error) {
      await this.recordFailure(entityType, entityId, error);
      return false;
    }
  }

  // Stores a failure entry with permanent/transient classification.
  private async recordFailure(
    entityType: RagEntityType,
    entityId: string,
    error: unknown,
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
    const isPermanent = this.isPermanentFailure(error);

    await this.ragBackfillRepository.upsertFailure(entityType, entityId, errorMessage, isPermanent);
  }

  // Determines whether a failure should be treated as permanent.
  private isPermanentFailure(error: unknown): boolean {
    if (error instanceof AppError) {
      return error.statusCode >= 400 && error.statusCode < 500;
    }

    return false;
  }

  // Extracts the entity id from any supported source type.
  private extractEntityId(
    entityType: RagEntityType,
    source:
      | ProductRagSource
      | CustomerRagSource
      | ManagerRagSource
      | OrderRagSource
      | OrderItemRagSource,
  ): string {
    if (entityType === 'customer') {
      return (source as CustomerRagSource).user_id;
    }

    return (source as { id: string }).id;
  }

  // Groups order items by order id for efficient lookup.
  private groupOrderItemsByOrderId(items: OrderItemRagSource[]): Map<string, OrderItemRagSource[]> {
    const grouped = new Map<string, OrderItemRagSource[]>();

    for (const item of items) {
      const bucket = grouped.get(item.order_id);
      if (bucket) {
        bucket.push(item);
      } else {
        grouped.set(item.order_id, [item]);
      }
    }

    return grouped;
  }

  // Checks failure rate and logs a warning if threshold is exceeded.
  private checkFailureRate(report: RagBackfillReport, threshold: number): void {
    if (report.total === 0) {
      return;
    }

    const rate = report.failures / report.total;
    if (rate >= threshold) {
      console.warn(
        JSON.stringify({
          evento: 'rag_backfill_alerta',
          mensagem: 'Taxa de falhas acima do limite configurado.',
          taxaFalhas: Number(rate.toFixed(4)),
          limite: threshold,
        }),
      );
    }
  }

  // Creates a zeroed report structure for per-entity counters.
  private createEmptyEntityStats(): Record<RagEntityType, { total: number; success: number; failures: number }> {
    return {
      product: { total: 0, success: 0, failures: 0 },
      customer: { total: 0, success: 0, failures: 0 },
      manager: { total: 0, success: 0, failures: 0 },
      order: { total: 0, success: 0, failures: 0 },
      order_item: { total: 0, success: 0, failures: 0 },
    };
  }

  // Delays execution for the given duration in milliseconds.
  private async delay(durationMs: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, durationMs));
  }
}

// Builds a default backfill input using environment configuration.
export const defaultRagBackfillInput = (): RagBackfillInput => ({
  entityTypes: ['product', 'customer', 'manager', 'order', 'order_item'],
  dryRun: false,
  batchSize: env.ragBackfillBatchSize,
  maxItemAttempts: env.ragBackfillMaxAttempts,
  failureAlertThreshold: env.ragBackfillFailureAlertThreshold,
});
