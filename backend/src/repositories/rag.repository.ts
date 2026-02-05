import { runQuery, type QueryExecutor } from '../config/database.js';

export type RagEntityType = 'product' | 'customer' | 'manager' | 'order' | 'order_item';

export type RagDocumentInput = {
  entityType: RagEntityType;
  entityId: string;
  contentMarkdown: string;
  embedding: number[];
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
          updated_at
        )
        VALUES ($1, $2, $3, $4::vector, $5::jsonb, NOW())
        ON CONFLICT (entity_type, entity_id)
        DO UPDATE
        SET
          content_markdown = EXCLUDED.content_markdown,
          embedding = EXCLUDED.embedding,
          metadata_json = EXCLUDED.metadata_json,
          updated_at = NOW()
      `,
      [
        input.entityType,
        input.entityId,
        input.contentMarkdown,
        embeddingVector,
        JSON.stringify(input.metadataJson),
      ],
    );
  }

  // Runs cosine similarity search with optional entity filtering.
  async searchDocuments(input: {
    embedding: number[];
    topK: number;
    entityTypes: RagEntityType[];
  }): Promise<RagSearchRow[]> {
    const embeddingVector = `[${input.embedding.map((value) => value.toFixed(6)).join(',')}]`;

    return runQuery<RagSearchRow>(
      `
        SELECT
          entity_type,
          entity_id,
          content_markdown,
          metadata_json,
          1 - (embedding <=> $1::vector) AS score
        FROM rag_documents
        WHERE
          CASE
            WHEN cardinality($2::text[]) = 0 THEN TRUE
            ELSE entity_type = ANY($2::text[])
          END
        ORDER BY embedding <=> $1::vector
        LIMIT $3
      `,
      [embeddingVector, input.entityTypes, input.topK],
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
}
