import { AppError } from '../common/app-error.js';
import { env } from '../config/env.js';
import type { QueryExecutor } from '../config/database.js';
import { RagRepository, type RagEntityType } from '../repositories/rag.repository.js';

const MAX_TOP_K = 20;
const MIN_TOP_K = 1;

export type RagSearchInput = {
  query: string;
  topK?: number;
  entityTypes?: string[];
};

export type RagSearchResponse = {
  mensagem: string;
  resultados: Array<{
    entityType: RagEntityType;
    entityId: string;
    score: number;
    snippet: string;
    metadata: Record<string, unknown>;
  }>;
};

export type RagProductSyncInput = {
  id: string;
  name: string;
  description: string;
  category: string;
  salePriceCents: number;
  weightGrams: number | null;
  stockQuantity: number;
  isActive: boolean;
  updatedAt: string;
};

export type RagCustomerSyncInput = {
  userId: string;
  city: string;
  state: string;
  updatedAt: string;
};

export type RagManagerSyncInput = {
  id: string;
  updatedAt: string;
};

export type RagOrderSyncInput = {
  id: string;
  customerId: string;
  status: string;
  totalAmountCents: number;
  itemsCount: number;
  shippingCity: string;
  shippingState: string;
  updatedAt: string;
};

export type RagOrderItemSyncInput = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productCategory: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

type RagSyncMetrics = {
  indexedCount: number;
  failCount: number;
  lastEmbeddingLatencyMs: number | null;
};

type RagLogger = {
  info: (payload: Record<string, unknown>) => void;
  error: (payload: Record<string, unknown>) => void;
};

export class RagSyncService {
  private readonly metrics: RagSyncMetrics;
  private readonly logger: RagLogger;

  constructor(private readonly ragRepository: RagRepository) {
    this.metrics = {
      indexedCount: 0,
      failCount: 0,
      lastEmbeddingLatencyMs: null,
    };

    this.logger = {
      info: (payload) => {
        console.info(JSON.stringify(payload));
      },
      error: (payload) => {
        console.error(JSON.stringify(payload));
      },
    };
  }

  // Upserts a generic document into the RAG index with generated embeddings.
  async upsertDocument(
    entityType: RagEntityType,
    entityId: string,
    markdown: string,
    metadata: Record<string, unknown>,
    sourceUpdatedAt: string | null,
    query?: QueryExecutor,
  ): Promise<void> {
    const startedAt = Date.now();

    try {
      const { embedding, latencyMs } = await this.createEmbeddingWithRetry(markdown);

      await this.ragRepository.upsertDocument(
        {
          entityType,
          entityId,
          contentMarkdown: markdown,
          embedding,
          sourceUpdatedAt,
          metadataJson: metadata,
        },
        query,
      );

      this.metrics.indexedCount += 1;
      this.metrics.lastEmbeddingLatencyMs = latencyMs;

      this.logIndexingSuccess(entityType, entityId, startedAt, latencyMs);
    } catch (error) {
      this.metrics.failCount += 1;
      this.logIndexingFailure(entityType, entityId, startedAt, error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(500, 'Não foi possível sincronizar o índice vetorial.');
    }
  }

  // Deletes a document from the vector index for the informed entity.
  async deleteDocument(entityType: RagEntityType, entityId: string, query?: QueryExecutor): Promise<void> {
    try {
      await this.ragRepository.deleteDocument(entityType, entityId, query);
    } catch (error) {
      this.metrics.failCount += 1;
      this.logIndexingFailure(entityType, entityId, Date.now(), error);
      throw new AppError(500, 'Não foi possível remover o índice vetorial.');
    }
  }

  // Performs semantic search across vector documents with optional filters.
  async search(input: RagSearchInput): Promise<RagSearchResponse> {
    const normalizedQuery = input.query?.trim() ?? '';

    if (!normalizedQuery) {
      throw new AppError(400, 'Digite uma pergunta para pesquisar.');
    }

    const topK = this.validateTopK(input.topK);
    const entityTypes = this.validateEntityTypes(input.entityTypes);
    const { embedding } = await this.createEmbeddingWithRetry(normalizedQuery);
    const rows = await this.ragRepository.searchDocuments({
      embedding,
      topK,
      entityTypes,
    });

    return {
      mensagem: rows.length > 0 ? 'Pesquisa RAG concluída com sucesso.' : 'Nenhum resultado encontrado.',
      resultados: rows.map((row) => ({
        entityType: row.entity_type,
        entityId: row.entity_id,
        score: Number(row.score.toFixed(6)),
        snippet: this.createSnippet(row.content_markdown),
        metadata: row.metadata_json,
      })),
    };
  }

  // Builds markdown and upserts a product document into the RAG index.
  async syncProduct(product: RagProductSyncInput, query?: QueryExecutor): Promise<void> {
    const markdown = this.buildProductMarkdown(product);

    await this.upsertDocument(
      'product',
      product.id,
      markdown,
      {
        category: product.category,
        sale_price: product.salePriceCents / 100,
        weight: product.weightGrams,
        updated_at: product.updatedAt,
        is_active: product.isActive,
        stock_quantity: product.stockQuantity,
      },
      product.updatedAt,
      query,
    );
  }

  // Builds markdown and upserts a customer document into the RAG index.
  async syncCustomer(customer: RagCustomerSyncInput, query?: QueryExecutor): Promise<void> {
    const markdown = this.buildCustomerMarkdown(customer);

    await this.upsertDocument(
      'customer',
      customer.userId,
      markdown,
      {
        city: customer.city,
        state: customer.state,
        updated_at: customer.updatedAt,
      },
      customer.updatedAt,
      query,
    );
  }

  // Builds markdown and upserts a manager document into the RAG index.
  async syncManager(manager: RagManagerSyncInput, query?: QueryExecutor): Promise<void> {
    const markdown = this.buildManagerMarkdown(manager);

    await this.upsertDocument(
      'manager',
      manager.id,
      markdown,
      {
        updated_at: manager.updatedAt,
      },
      manager.updatedAt,
      query,
    );
  }

  // Builds markdown and upserts an order document into the RAG index.
  async syncOrder(
    order: RagOrderSyncInput,
    items: RagOrderItemSyncInput[],
    query?: QueryExecutor,
  ): Promise<void> {
    const markdown = this.buildOrderMarkdown(order, items);

    await this.upsertDocument(
      'order',
      order.id,
      markdown,
      {
        customer_id: order.customerId,
        status: order.status,
        total_amount: order.totalAmountCents / 100,
        items_count: order.itemsCount,
        shipping_city: order.shippingCity,
        shipping_state: order.shippingState,
        updated_at: order.updatedAt,
      },
      order.updatedAt,
      query,
    );
  }

  // Builds markdown and upserts an order item document into the RAG index.
  async syncOrderItem(item: RagOrderItemSyncInput, query?: QueryExecutor): Promise<void> {
    const markdown = this.buildOrderItemMarkdown(item);

    await this.upsertDocument(
      'order_item',
      item.id,
      markdown,
      {
        order_id: item.orderId,
        product_id: item.productId,
        category: item.productCategory,
        quantity: item.quantity,
      },
      null,
      query,
    );
  }

  // Builds markdown representation for product indexing.
  buildProductMarkdown(product: RagProductSyncInput): string {
    return [
      '# Produto',
      `- ID: ${product.id}`,
      `- Nome: ${product.name}`,
      `- Categoria: ${product.category}`,
      `- Preço: ${this.formatCurrency(product.salePriceCents)}`,
      `- Peso (g): ${product.weightGrams ?? 'não informado'}`,
      `- Estoque disponível: ${product.stockQuantity}`,
      `- Ativo: ${product.isActive ? 'sim' : 'não'}`,
      '## Descrição',
      product.description,
    ].join('\n');
  }

  // Builds markdown representation for customer indexing without sensitive data.
  buildCustomerMarkdown(customer: RagCustomerSyncInput): string {
    return [
      '# Cliente',
      `- ID usuário: ${customer.userId}`,
      `- Cidade: ${customer.city}`,
      `- UF: ${customer.state}`,
    ].join('\n');
  }

  // Builds markdown representation for manager indexing without sensitive data.
  buildManagerMarkdown(manager: RagManagerSyncInput): string {
    return ['# Gestor', `- ID usuário: ${manager.id}`].join('\n');
  }

  // Builds markdown representation for order indexing without sensitive data.
  buildOrderMarkdown(order: RagOrderSyncInput, items: RagOrderItemSyncInput[]): string {
    const itemLines = items.map(
      (item) =>
        `- ${item.productName} | categoria: ${item.productCategory} | quantidade: ${item.quantity} | preço unitário: ${this.formatCurrency(item.unitPriceCents)} | subtotal: ${this.formatCurrency(item.lineTotalCents)}`,
    );

    return [
      '# Pedido',
      `- ID: ${order.id}`,
      `- Status: ${order.status}`,
      `- Itens: ${order.itemsCount}`,
      `- Total: ${this.formatCurrency(order.totalAmountCents)}`,
      `- Entrega: ${order.shippingCity}/${order.shippingState}`,
      '## Itens',
      ...itemLines,
    ].join('\n');
  }

  // Builds markdown representation for order item indexing.
  buildOrderItemMarkdown(item: RagOrderItemSyncInput): string {
    return [
      '# Item de pedido',
      `- ID item: ${item.id}`,
      `- ID pedido: ${item.orderId}`,
      `- ID produto: ${item.productId}`,
      `- Nome produto: ${item.productName}`,
      `- Categoria: ${item.productCategory}`,
      `- Quantidade: ${item.quantity}`,
      `- Preço unitário: ${this.formatCurrency(item.unitPriceCents)}`,
      `- Total da linha: ${this.formatCurrency(item.lineTotalCents)}`,
    ].join('\n');
  }

  // Validates topK boundaries and applies default values.
  private validateTopK(topK: number | undefined): number {
    const normalizedTopK = Number(topK ?? 5);

    if (!Number.isInteger(normalizedTopK) || normalizedTopK < MIN_TOP_K || normalizedTopK > MAX_TOP_K) {
      throw new AppError(400, `Informe um topK entre ${MIN_TOP_K} e ${MAX_TOP_K}.`);
    }

    return normalizedTopK;
  }

  // Validates and normalizes entity type filters.
  private validateEntityTypes(entityTypes: string[] | undefined): RagEntityType[] {
    if (!entityTypes || entityTypes.length === 0) {
      return [];
    }

    const allowedEntityTypes: RagEntityType[] = ['product', 'customer', 'manager', 'order', 'order_item'];

    return entityTypes
      .map((entityType) => entityType.trim().toLowerCase())
      .filter((entityType): entityType is RagEntityType =>
        allowedEntityTypes.includes(entityType as RagEntityType),
      );
  }

  // Creates deterministic embedding with retry and timeout for transient failures.
  private async createEmbeddingWithRetry(
    content: string,
  ): Promise<{ embedding: number[]; latencyMs: number }> {
    const maxAttempts = env.embeddingsRetryCount;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const startedAt = Date.now();
        const embedding = await this.createEmbedding(content);
        return { embedding, latencyMs: Date.now() - startedAt };
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new AppError(500, 'Não foi possível gerar os embeddings da pesquisa.');
        }

        await this.delay(attempt * 75);
        void error;
      }
    }

    throw new AppError(500, 'Não foi possível gerar os embeddings da pesquisa.');
  }

  // Generates embeddings using the configured provider or deterministic fallback.
  private async createEmbedding(content: string): Promise<number[]> {
    if (env.embeddingsProvider === 'deterministic') {
      return this.createDeterministicEmbedding(content);
    }

    if (env.embeddingsProvider === 'http') {
      return this.createHttpEmbedding(content);
    }

    throw new AppError(500, 'Provedor de embeddings não configurado.');
  }

  // Calls an HTTP embedding provider with timeout enforcement.
  private async createHttpEmbedding(content: string): Promise<number[]> {
    if (!env.embeddingsEndpoint) {
      throw new AppError(500, 'Provedor de embeddings não configurado.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), env.embeddingsTimeoutMs);

    try {
      const response = await fetch(env.embeddingsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: content }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new AppError(502, 'Não foi possível gerar os embeddings da pesquisa.');
      }

      const payload = (await response.json()) as { embedding?: number[] };

      if (!Array.isArray(payload.embedding)) {
        throw new AppError(502, 'Não foi possível gerar os embeddings da pesquisa.');
      }

      return payload.embedding;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Generates a deterministic fixed-size embedding vector from text.
  private createDeterministicEmbedding(content: string): number[] {
    const vector = new Array<number>(env.embeddingDimension).fill(0);

    for (let index = 0; index < content.length; index += 1) {
      const charCode = content.charCodeAt(index);
      const bucket = index % env.embeddingDimension;
      vector[bucket] += (charCode % 97) / 97;
    }

    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    return magnitude === 0 ? vector : vector.map((value) => value / magnitude);
  }

  // Creates a readable snippet from markdown content.
  private createSnippet(contentMarkdown: string): string {
    return contentMarkdown.replaceAll('\n', ' ').slice(0, 240);
  }

  // Formats integer cents value into localized BRL currency.
  private formatCurrency(valueInCents: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(valueInCents / 100);
  }

  // Waits asynchronously before retrying a transient operation.
  private async delay(durationMs: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, durationMs);
    });
  }

  // Logs successful indexing events with metrics for observability.
  private logIndexingSuccess(
    entityType: RagEntityType,
    entityId: string,
    startedAt: number,
    latencyMs: number,
  ): void {
    this.logger.info({
      event: 'rag_index_success',
      entityType,
      entityId,
      durationMs: Date.now() - startedAt,
      embeddingLatencyMs: latencyMs,
      indexedCount: this.metrics.indexedCount,
      failCount: this.metrics.failCount,
    });
  }

  // Logs failed indexing events with error details and metrics.
  private logIndexingFailure(
    entityType: RagEntityType,
    entityId: string,
    startedAt: number,
    error: unknown,
  ): void {
    const errorMessage = error instanceof Error ? error.message : 'unknown_error';

    this.logger.error({
      event: 'rag_index_failure',
      entityType,
      entityId,
      durationMs: Date.now() - startedAt,
      errorMessage,
      indexedCount: this.metrics.indexedCount,
      failCount: this.metrics.failCount,
    });
  }
}
