import { runQuery, type QueryExecutor } from '../config/database.js';

export type RagEntityType = 'product' | 'customer' | 'manager' | 'order' | 'order_item';

export type RagDocumentInput = {
  entityType: RagEntityType;
  entityId: string;
  contentMarkdown: string;
  embedding: number[];
  sourceUpdatedAt?: string | null;
  metadataJson: Record<string, unknown>;
};

export type RagSearchRow = {
  entity_type: RagEntityType;
  entity_id: string;
  content_markdown: string;
  metadata_json: Record<string, unknown>;
  score: number;
};

export type ProductRagSource = {
  id: string;
  name: string;
  description: string;
  category: string;
  price_cents: number;
  weight_grams: number | null;
  is_active: boolean;
  stock_quantity: number;
  updated_at: string;
};

export type CustomerRagSource = {
  user_id: string;
  full_name: string;
  cpf: string;
  email: string;
  city: string;
  state: string;
  updated_at: string;
};

export type ManagerRagSource = {
  id: string;
  username: string | null;
  email: string | null;
  updated_at: string;
};

export type OrderRagSource = {
  id: string;
  customer_id: string;
  status: string;
  total_amount_cents: number;
  items_count: number;
  shipping_city: string;
  shipping_state: string;
  updated_at: string;
};

export type OrderItemRagSource = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
};

export class RagRepository {
  // Upserts a vectorized document for one relational entity.
  async upsertDocument(input: RagDocumentInput, query?: QueryExecutor): Promise<void> {
    const execute = query ?? runQuery;
    const embeddingVector = `[${input.embedding.map((value) => value.toFixed(6)).join(',')}]`;

    await execute(
      `
        INSERT INTO rag_documents (
          entity_type,
          entity_id,
          content_markdown,
          embedding,
          metadata_json,
          source_updated_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4::vector, $5::jsonb, $6::timestamptz, NOW())
        ON CONFLICT (entity_type, entity_id)
        DO UPDATE
        SET
          content_markdown = EXCLUDED.content_markdown,
          embedding = EXCLUDED.embedding,
          metadata_json = EXCLUDED.metadata_json,
          source_updated_at = EXCLUDED.source_updated_at,
          updated_at = NOW()
      `,
      [
        input.entityType,
        input.entityId,
        input.contentMarkdown,
        embeddingVector,
        JSON.stringify(input.metadataJson),
        input.sourceUpdatedAt ?? null,
      ],
    );
  }

  // Deletes a vectorized document for one relational entity.
  async deleteDocument(entityType: RagEntityType, entityId: string, query?: QueryExecutor): Promise<void> {
    const execute = query ?? runQuery;

    await execute(
      `
        DELETE FROM rag_documents
        WHERE entity_type = $1
          AND entity_id = $2
      `,
      [entityType, entityId],
    );
  }

  // Runs cosine similarity search with optional entity filtering.
  async searchDocuments(input: {
    embedding: number[];
    topK: number;
    entityTypes: RagEntityType[];
  }): Promise<RagSearchRow[]> {
    const embeddingVector = `[${input.embedding.map((value) => value.toFixed(6)).join(',')}]`;

    const entityTypes = input.entityTypes.length > 0 ? input.entityTypes : null;

    return runQuery<RagSearchRow>(
      `
        SELECT
          entity_type,
          entity_id,
          content_markdown,
          metadata_json,
          score
        FROM rag_search($1::vector, $2::int, $3::text[])
      `,
      [embeddingVector, input.topK, entityTypes],
    );
  }

  // Loads product rows that should be indexed by the RAG layer.
  async listProductsForIndexing(): Promise<ProductRagSource[]> {
    return runQuery<ProductRagSource>(
      `
        SELECT
          p.id,
          p.name,
          p.description,
          p.category,
          p.price_cents,
          p.weight_grams,
          p.is_active,
          COALESCE(i.quantity - i.reserved_quantity, 0) AS stock_quantity,
          p.updated_at::text
        FROM products p
        LEFT JOIN inventory i ON i.product_id = p.id
      `,
    );
  }

  // Loads customer profile rows that should be indexed by the RAG layer.
  async listCustomersForIndexing(): Promise<CustomerRagSource[]> {
    return runQuery<CustomerRagSource>(
      `
        SELECT
          cp.user_id,
          cp.full_name,
          cp.cpf,
          u.email,
          cp.city,
          cp.state,
          GREATEST(cp.updated_at, u.updated_at)::text AS updated_at
        FROM customers_profile cp
        INNER JOIN users u ON u.id = cp.user_id
      `,
    );
  }

  // Loads manager users that should be indexed by the RAG layer.
  async listManagersForIndexing(): Promise<ManagerRagSource[]> {
    return runQuery<ManagerRagSource>(
      `
        SELECT id, username, email, updated_at::text
        FROM users
        WHERE role = 'MANAGER'
      `,
    );
  }

  // Loads order rows that should be indexed by the RAG layer.
  async listOrdersForIndexing(): Promise<OrderRagSource[]> {
    return runQuery<OrderRagSource>(
      `
        SELECT
          id,
          customer_id,
          status,
          total_amount_cents,
          items_count,
          shipping_city,
          shipping_state,
          updated_at::text
        FROM orders
      `,
    );
  }

  // Loads order item rows that should be indexed by the RAG layer.
  async listOrderItemsForIndexing(): Promise<OrderItemRagSource[]> {
    return runQuery<OrderItemRagSource>(
      `
        SELECT
          id,
          order_id,
          product_id,
          product_name,
          product_category,
          quantity,
          unit_price_cents,
          line_total_cents
        FROM order_items
      `,
    );
  }

  // Counts product rows eligible for indexing with optional filters.
  async countProductsForIndexing(input: {
    fromDate?: string;
    toDate?: string;
    entityId?: string;
  }): Promise<number> {
    const rows = await runQuery<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM products p
        WHERE ($1::timestamptz IS NULL OR p.updated_at >= $1)
          AND ($2::timestamptz IS NULL OR p.updated_at <= $2)
          AND ($3::uuid IS NULL OR p.id = $3)
      `,
      [input.fromDate ?? null, input.toDate ?? null, input.entityId ?? null],
    );

    return Number(rows[0]?.total ?? 0);
  }

  // Loads product rows for indexing in batches with filters.
  async listProductsForIndexingBatch(input: {
    fromDate?: string;
    toDate?: string;
    entityId?: string;
    limit: number;
    offset: number;
  }): Promise<ProductRagSource[]> {
    return runQuery<ProductRagSource>(
      `
        SELECT
          p.id,
          p.name,
          p.description,
          p.category,
          p.price_cents,
          p.weight_grams,
          p.is_active,
          COALESCE(i.quantity - i.reserved_quantity, 0) AS stock_quantity,
          p.updated_at::text
        FROM products p
        LEFT JOIN inventory i ON i.product_id = p.id
        WHERE ($1::timestamptz IS NULL OR p.updated_at >= $1)
          AND ($2::timestamptz IS NULL OR p.updated_at <= $2)
          AND ($3::uuid IS NULL OR p.id = $3)
        ORDER BY p.updated_at ASC, p.id ASC
        LIMIT $4
        OFFSET $5
      `,
      [input.fromDate ?? null, input.toDate ?? null, input.entityId ?? null, input.limit, input.offset],
    );
  }

  // Counts customer profile rows eligible for indexing with optional filters.
  async countCustomersForIndexing(input: {
    fromDate?: string;
    toDate?: string;
    entityId?: string;
  }): Promise<number> {
    const rows = await runQuery<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM customers_profile cp
        INNER JOIN users u ON u.id = cp.user_id
        WHERE ($1::timestamptz IS NULL OR GREATEST(cp.updated_at, u.updated_at) >= $1)
          AND ($2::timestamptz IS NULL OR GREATEST(cp.updated_at, u.updated_at) <= $2)
          AND ($3::uuid IS NULL OR cp.user_id = $3)
      `,
      [input.fromDate ?? null, input.toDate ?? null, input.entityId ?? null],
    );

    return Number(rows[0]?.total ?? 0);
  }

  // Loads customer profile rows for indexing in batches with filters.
  async listCustomersForIndexingBatch(input: {
    fromDate?: string;
    toDate?: string;
    entityId?: string;
    limit: number;
    offset: number;
  }): Promise<CustomerRagSource[]> {
    return runQuery<CustomerRagSource>(
      `
        SELECT
          cp.user_id,
          cp.full_name,
          cp.cpf,
          u.email,
          cp.city,
          cp.state,
          GREATEST(cp.updated_at, u.updated_at)::text AS updated_at
        FROM customers_profile cp
        INNER JOIN users u ON u.id = cp.user_id
        WHERE ($1::timestamptz IS NULL OR GREATEST(cp.updated_at, u.updated_at) >= $1)
          AND ($2::timestamptz IS NULL OR GREATEST(cp.updated_at, u.updated_at) <= $2)
          AND ($3::uuid IS NULL OR cp.user_id = $3)
        ORDER BY GREATEST(cp.updated_at, u.updated_at) ASC, cp.user_id ASC
        LIMIT $4
        OFFSET $5
      `,
      [input.fromDate ?? null, input.toDate ?? null, input.entityId ?? null, input.limit, input.offset],
    );
  }

  // Counts manager rows eligible for indexing with optional filters.
  async countManagersForIndexing(input: {
    fromDate?: string;
    toDate?: string;
    entityId?: string;
  }): Promise<number> {
    const rows = await runQuery<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM users
        WHERE role = 'MANAGER'
          AND ($1::timestamptz IS NULL OR updated_at >= $1)
          AND ($2::timestamptz IS NULL OR updated_at <= $2)
          AND ($3::uuid IS NULL OR id = $3)
      `,
      [input.fromDate ?? null, input.toDate ?? null, input.entityId ?? null],
    );

    return Number(rows[0]?.total ?? 0);
  }

  // Loads manager rows for indexing in batches with filters.
  async listManagersForIndexingBatch(input: {
    fromDate?: string;
    toDate?: string;
    entityId?: string;
    limit: number;
    offset: number;
  }): Promise<ManagerRagSource[]> {
    return runQuery<ManagerRagSource>(
      `
        SELECT id, username, email, updated_at::text
        FROM users
        WHERE role = 'MANAGER'
          AND ($1::timestamptz IS NULL OR updated_at >= $1)
          AND ($2::timestamptz IS NULL OR updated_at <= $2)
          AND ($3::uuid IS NULL OR id = $3)
        ORDER BY updated_at ASC, id ASC
        LIMIT $4
        OFFSET $5
      `,
      [input.fromDate ?? null, input.toDate ?? null, input.entityId ?? null, input.limit, input.offset],
    );
  }

  // Counts order rows eligible for indexing with optional filters.
  async countOrdersForIndexing(input: {
    fromDate?: string;
    toDate?: string;
    entityId?: string;
  }): Promise<number> {
    const rows = await runQuery<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM orders
        WHERE ($1::timestamptz IS NULL OR updated_at >= $1)
          AND ($2::timestamptz IS NULL OR updated_at <= $2)
          AND ($3::uuid IS NULL OR id = $3)
      `,
      [input.fromDate ?? null, input.toDate ?? null, input.entityId ?? null],
    );

    return Number(rows[0]?.total ?? 0);
  }

  // Loads order rows for indexing in batches with filters.
  async listOrdersForIndexingBatch(input: {
    fromDate?: string;
    toDate?: string;
    entityId?: string;
    limit: number;
    offset: number;
  }): Promise<OrderRagSource[]> {
    return runQuery<OrderRagSource>(
      `
        SELECT
          id,
          customer_id,
          status,
          total_amount_cents,
          items_count,
          shipping_city,
          shipping_state,
          updated_at::text
        FROM orders
        WHERE ($1::timestamptz IS NULL OR updated_at >= $1)
          AND ($2::timestamptz IS NULL OR updated_at <= $2)
          AND ($3::uuid IS NULL OR id = $3)
        ORDER BY updated_at ASC, id ASC
        LIMIT $4
        OFFSET $5
      `,
      [input.fromDate ?? null, input.toDate ?? null, input.entityId ?? null, input.limit, input.offset],
    );
  }

  // Counts order item rows eligible for indexing with optional filters.
  async countOrderItemsForIndexing(input: {
    fromDate?: string;
    toDate?: string;
    entityId?: string;
  }): Promise<number> {
    const rows = await runQuery<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM order_items
        WHERE ($1::timestamptz IS NULL OR created_at >= $1)
          AND ($2::timestamptz IS NULL OR created_at <= $2)
          AND ($3::uuid IS NULL OR id = $3)
      `,
      [input.fromDate ?? null, input.toDate ?? null, input.entityId ?? null],
    );

    return Number(rows[0]?.total ?? 0);
  }

  // Loads order item rows for indexing in batches with filters.
  async listOrderItemsForIndexingBatch(input: {
    fromDate?: string;
    toDate?: string;
    entityId?: string;
    limit: number;
    offset: number;
  }): Promise<OrderItemRagSource[]> {
    return runQuery<OrderItemRagSource>(
      `
        SELECT
          id,
          order_id,
          product_id,
          product_name,
          product_category,
          quantity,
          unit_price_cents,
          line_total_cents
        FROM order_items
        WHERE ($1::timestamptz IS NULL OR created_at >= $1)
          AND ($2::timestamptz IS NULL OR created_at <= $2)
          AND ($3::uuid IS NULL OR id = $3)
        ORDER BY created_at ASC, id ASC
        LIMIT $4
        OFFSET $5
      `,
      [input.fromDate ?? null, input.toDate ?? null, input.entityId ?? null, input.limit, input.offset],
    );
  }

  // Loads order item rows for a list of order ids.
  async listOrderItemsForOrders(orderIds: string[]): Promise<OrderItemRagSource[]> {
    return runQuery<OrderItemRagSource>(
      `
        SELECT
          id,
          order_id,
          product_id,
          product_name,
          product_category,
          quantity,
          unit_price_cents,
          line_total_cents
        FROM order_items
        WHERE order_id = ANY($1::uuid[])
      `,
      [orderIds],
    );
  }
}
