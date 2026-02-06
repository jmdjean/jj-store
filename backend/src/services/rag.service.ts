import { AppError } from '../common/app-error.js';
import { env } from '../config/env.js';
import {
  RagRepository,
  type RagEntityType,
  type CustomerRagSource,
  type ManagerRagSource,
  type OrderItemRagSource,
  type OrderRagSource,
  type ProductRagSource,
} from '../repositories/rag.repository.js';

const EMBEDDING_DIMENSION = env.embeddingDimension;
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

export class RagService {
  constructor(private readonly ragRepository: RagRepository) {}

  // Synchronizes all stage-07 entities into rag_documents.
  async syncAllEntities(): Promise<void> {
    const [products, customers, managers, orders, orderItems] = await Promise.all([
      this.ragRepository.listProductsForIndexing(),
      this.ragRepository.listCustomersForIndexing(),
      this.ragRepository.listManagersForIndexing(),
      this.ragRepository.listOrdersForIndexing(),
      this.ragRepository.listOrderItemsForIndexing(),
    ]);

    await this.syncProducts(products);
    await this.syncCustomers(customers);
    await this.syncManagers(managers);
    await this.syncOrders(orders);
    await this.syncOrderItems(orderItems);
  }

  // Executes semantic search with optional entity filters and topK control.
  async search(input: RagSearchInput): Promise<RagSearchResponse> {
    const normalizedQuery = input.query?.trim() ?? '';

    if (!normalizedQuery) {
      throw new AppError(400, 'Digite uma pergunta para pesquisar.');
    }

    const topK = this.validateTopK(input.topK);
    const entityTypes = this.validateEntityTypes(input.entityTypes);
    const queryEmbedding = await this.createEmbeddingWithRetry(normalizedQuery);

    const rows = await this.ragRepository.searchDocuments({
      embedding: queryEmbedding,
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

  // Synchronizes product documents into the vector table.
  async syncProducts(products: ProductRagSource[]): Promise<void> {
    await Promise.all(
      products.map(async (product) => {
        const contentMarkdown = this.buildProductMarkdown(product);
        const embedding = await this.createEmbeddingWithRetry(contentMarkdown);

        await this.ragRepository.upsertDocument({
          entityType: 'product',
          entityId: product.id,
          contentMarkdown,
          embedding,
          sourceUpdatedAt: product.updated_at,
          metadataJson: {
            category: product.category,
            salePrice: product.price_cents / 100,
            weightGrams: product.weight_grams,
            stockQuantity: product.stock_quantity,
            isActive: product.is_active,
            updatedAt: product.updated_at,
          },
        });
      }),
    );
  }

  // Synchronizes customer documents into the vector table.
  async syncCustomers(customers: CustomerRagSource[]): Promise<void> {
    await Promise.all(
      customers.map(async (customer) => {
        const contentMarkdown = this.buildCustomerMarkdown(customer);
        const embedding = await this.createEmbeddingWithRetry(contentMarkdown);

        await this.ragRepository.upsertDocument({
          entityType: 'customer',
          entityId: customer.user_id,
          contentMarkdown,
          embedding,
          sourceUpdatedAt: customer.updated_at,
          metadataJson: {
            city: customer.city,
            state: customer.state,
            updatedAt: customer.updated_at,
          },
        });
      }),
    );
  }

  // Synchronizes manager documents into the vector table.
  async syncManagers(managers: ManagerRagSource[]): Promise<void> {
    await Promise.all(
      managers.map(async (manager) => {
        const contentMarkdown = this.buildManagerMarkdown(manager);
        const embedding = await this.createEmbeddingWithRetry(contentMarkdown);

        await this.ragRepository.upsertDocument({
          entityType: 'manager',
          entityId: manager.id,
          contentMarkdown,
          embedding,
          sourceUpdatedAt: manager.updated_at,
          metadataJson: {
            email: manager.email,
            username: manager.username,
            updatedAt: manager.updated_at,
          },
        });
      }),
    );
  }

  // Synchronizes order documents into the vector table.
  async syncOrders(orders: OrderRagSource[]): Promise<void> {
    await Promise.all(
      orders.map(async (order) => {
        const contentMarkdown = this.buildOrderMarkdown(order);
        const embedding = await this.createEmbeddingWithRetry(contentMarkdown);

        await this.ragRepository.upsertDocument({
          entityType: 'order',
          entityId: order.id,
          contentMarkdown,
          embedding,
          sourceUpdatedAt: order.updated_at,
          metadataJson: {
            customerId: order.customer_id,
            status: order.status,
            totalAmount: order.total_amount_cents / 100,
            itemsCount: order.items_count,
            updatedAt: order.updated_at,
          },
        });
      }),
    );
  }

  // Synchronizes order item documents into the vector table.
  async syncOrderItems(orderItems: OrderItemRagSource[]): Promise<void> {
    await Promise.all(
      orderItems.map(async (item) => {
        const contentMarkdown = this.buildOrderItemMarkdown(item);
        const embedding = await this.createEmbeddingWithRetry(contentMarkdown);

        await this.ragRepository.upsertDocument({
          entityType: 'order_item',
          entityId: item.id,
          contentMarkdown,
          embedding,
          metadataJson: {
            orderId: item.order_id,
            productId: item.product_id,
            category: item.product_category,
            quantity: item.quantity,
          },
        });
      }),
    );
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

  // Builds markdown representation for product indexing.
  private buildProductMarkdown(product: ProductRagSource): string {
    return [
      '# Produto',
      `- ID: ${product.id}`,
      `- Nome: ${product.name}`,
      `- Categoria: ${product.category}`,
      `- Preço: ${this.formatCurrency(product.price_cents)}`,
      `- Peso (g): ${product.weight_grams ?? 'não informado'}`,
      `- Estoque disponível: ${product.stock_quantity}`,
      `- Ativo: ${product.is_active ? 'sim' : 'não'}`,
      '## Descrição',
      product.description,
    ].join('\n');
  }

  // Builds markdown representation for customer indexing.
  private buildCustomerMarkdown(customer: CustomerRagSource): string {
    return [
      '# Cliente',
      `- ID usuário: ${customer.user_id}`,
      `- Nome: ${customer.full_name}`,
      `- CPF: ${customer.cpf}`,
      `- E-mail: ${customer.email}`,
      `- Cidade: ${customer.city}`,
      `- UF: ${customer.state}`,
    ].join('\n');
  }

  // Builds markdown representation for manager indexing.
  private buildManagerMarkdown(manager: ManagerRagSource): string {
    return [
      '# Gestor',
      `- ID usuário: ${manager.id}`,
      `- Nome de usuário: ${manager.username ?? 'não informado'}`,
      `- E-mail: ${manager.email ?? 'não informado'}`,
    ].join('\n');
  }

  // Builds markdown representation for order indexing.
  private buildOrderMarkdown(order: OrderRagSource): string {
    return [
      '# Pedido',
      `- ID: ${order.id}`,
      `- ID cliente: ${order.customer_id}`,
      `- Status: ${order.status}`,
      `- Itens: ${order.items_count}`,
      `- Total: ${this.formatCurrency(order.total_amount_cents)}`,
      `- Entrega: ${order.shipping_city}/${order.shipping_state}`,
    ].join('\n');
  }

  // Builds markdown representation for order item indexing.
  private buildOrderItemMarkdown(item: OrderItemRagSource): string {
    return [
      '# Item de pedido',
      `- ID item: ${item.id}`,
      `- ID pedido: ${item.order_id}`,
      `- ID produto: ${item.product_id}`,
      `- Nome produto: ${item.product_name}`,
      `- Categoria: ${item.product_category}`,
      `- Quantidade: ${item.quantity}`,
      `- Preço unitário: ${this.formatCurrency(item.unit_price_cents)}`,
      `- Total da linha: ${this.formatCurrency(item.line_total_cents)}`,
    ].join('\n');
  }

  // Creates deterministic embedding with retry for transient failures.
  private async createEmbeddingWithRetry(content: string): Promise<number[]> {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return this.createDeterministicEmbedding(content);
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new AppError(500, 'Não foi possível gerar os embeddings da pesquisa.');
        }

        await this.delay(attempt * 50);
        void error;
      }
    }

    throw new AppError(500, 'Não foi possível gerar os embeddings da pesquisa.');
  }

  // Generates a deterministic fixed-size embedding vector from text.
  private createDeterministicEmbedding(content: string): number[] {
    const vector = new Array<number>(EMBEDDING_DIMENSION).fill(0);

    for (let index = 0; index < content.length; index += 1) {
      const charCode = content.charCodeAt(index);
      const bucket = index % EMBEDDING_DIMENSION;
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
}
