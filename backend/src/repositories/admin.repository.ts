import type { QueryResultRow } from 'pg';
import { runQuery, type QueryExecutor } from '../config/database.js';

export type AdminPainelData = {
  mensagem: string;
};

type AdminProductDatabaseRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  image_url: string | null;
  purchase_price_cents: number;
  sale_price_cents: number;
  weight_grams: number | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

export type AdminProductSnapshot = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string | null;
  purchasePriceCents: number;
  salePriceCents: number;
  weightGrams: number | null;
  stockQuantity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminProductsQueryInput = {
  q: string | null;
  category: string | null;
  status: 'active' | 'inactive' | 'all';
};

export type CreateAdminProductInput = {
  slug: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string | null;
  purchasePriceCents: number;
  salePriceCents: number;
  weightGrams: number | null;
  quantity: number;
};

export type UpdateAdminProductInput = {
  productId: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string | null;
  purchasePriceCents: number;
  salePriceCents: number;
  weightGrams: number | null;
  quantity: number;
};

export type UpsertRagDocumentInput = {
  entityType: string;
  entityId: string;
  contentMarkdown: string;
  embedding: number[];
  metadataJson: Record<string, unknown>;
};

export type CreateAuditLogInput = {
  actorUserId: string;
  entityType: string;
  entityId: string;
  action: string;
  payloadJson: Record<string, unknown>;
};

export class AdminRepository {
  // Retrieves the static dashboard payload used by the admin root page.
  getPainelData(): AdminPainelData {
    return {
      mensagem: 'Painel administrativo liberado.',
    };
  }

  // Lists products with optional search/category filters and active status selection.
  async listProducts(input: AdminProductsQueryInput): Promise<AdminProductSnapshot[]> {
    const rows = await runQuery<AdminProductDatabaseRecord>(
      `
        SELECT
          p.id,
          p.slug,
          p.name,
          p.description,
          p.category,
          p.image_url,
          p.purchase_price_cents,
          p.price_cents AS sale_price_cents,
          p.weight_grams,
          COALESCE(i.quantity, 0) AS stock_quantity,
          p.is_active,
          p.created_at,
          p.updated_at
        FROM products p
        LEFT JOIN inventory i ON i.product_id = p.id
        WHERE
          ($1::text IS NULL OR p.name ILIKE '%' || $1 || '%' OR p.description ILIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR p.category = $2)
          AND (
            $3::text = 'all'
            OR ($3::text = 'active' AND p.is_active = TRUE)
            OR ($3::text = 'inactive' AND p.is_active = FALSE)
          )
        ORDER BY p.updated_at DESC, p.name ASC
      `,
      [input.q, input.category, input.status],
    );

    return rows.map((row) => this.mapProduct(row));
  }

  // Finds one product by identifier for edit operations.
  async findProductById(productId: string): Promise<AdminProductSnapshot | null> {
    const rows = await runQuery<AdminProductDatabaseRecord>(
      `
        SELECT
          p.id,
          p.slug,
          p.name,
          p.description,
          p.category,
          p.image_url,
          p.purchase_price_cents,
          p.price_cents AS sale_price_cents,
          p.weight_grams,
          COALESCE(i.quantity, 0) AS stock_quantity,
          p.is_active,
          p.created_at,
          p.updated_at
        FROM products p
        LEFT JOIN inventory i ON i.product_id = p.id
        WHERE p.id = $1
        LIMIT 1
      `,
      [productId],
    );

    const product = rows[0];
    return product ? this.mapProduct(product) : null;
  }

  // Creates a product row and the related inventory row in the same transaction.
  async createProduct(query: QueryExecutor, input: CreateAdminProductInput): Promise<AdminProductSnapshot> {
    const createdRows = await query<{ id: string }>(
      `
        INSERT INTO products (
          slug,
          name,
          description,
          category,
          image_url,
          purchase_price_cents,
          price_cents,
          weight_grams,
          is_active,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, NOW())
        RETURNING id
      `,
      [
        input.slug,
        input.name,
        input.description,
        input.category,
        input.imageUrl,
        input.purchasePriceCents,
        input.salePriceCents,
        input.weightGrams,
      ],
    );

    const productId = createdRows[0].id;

    await query<QueryResultRow>(
      `
        INSERT INTO inventory (
          product_id,
          quantity,
          reserved_quantity,
          updated_at
        )
        VALUES ($1, $2, 0, NOW())
      `,
      [productId, input.quantity],
    );

    const product = await this.findProductByIdInQuery(query, productId);

    if (!product) {
      throw new Error('Failed to load created product snapshot.');
    }

    return product;
  }

  // Updates product fields and inventory quantity inside the current transaction.
  async updateProduct(query: QueryExecutor, input: UpdateAdminProductInput): Promise<AdminProductSnapshot | null> {
    const rows = await query<{ id: string }>(
      `
        UPDATE products
        SET
          name = $2,
          description = $3,
          category = $4,
          image_url = $5,
          purchase_price_cents = $6,
          price_cents = $7,
          weight_grams = $8,
          updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `,
      [
        input.productId,
        input.name,
        input.description,
        input.category,
        input.imageUrl,
        input.purchasePriceCents,
        input.salePriceCents,
        input.weightGrams,
      ],
    );

    if (rows.length === 0) {
      return null;
    }

    await query<QueryResultRow>(
      `
        INSERT INTO inventory (
          product_id,
          quantity,
          reserved_quantity,
          updated_at
        )
        VALUES ($1, $2, 0, NOW())
        ON CONFLICT (product_id)
        DO UPDATE
        SET
          quantity = EXCLUDED.quantity,
          updated_at = NOW()
      `,
      [input.productId, input.quantity],
    );

    return this.findProductByIdInQuery(query, input.productId);
  }

  // Marks a product as inactive and returns its latest snapshot.
  async deactivateProduct(query: QueryExecutor, productId: string): Promise<AdminProductSnapshot | null> {
    const rows = await query<{ id: string }>(
      `
        UPDATE products
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `,
      [productId],
    );

    if (rows.length === 0) {
      return null;
    }

    return this.findProductByIdInQuery(query, productId);
  }

  // Checks whether a slug is already used by any existing product.
  async slugExists(query: QueryExecutor, slug: string): Promise<boolean> {
    const rows = await query<{ slug: string }>(
      `
        SELECT slug
        FROM products
        WHERE slug = $1
        LIMIT 1
      `,
      [slug],
    );

    return rows.length > 0;
  }

  // Inserts one audit log entry for product administration actions.
  async insertAuditLog(query: QueryExecutor, input: CreateAuditLogInput): Promise<void> {
    await query<QueryResultRow>(
      `
        INSERT INTO audit_log (
          actor_user_id,
          entity_type,
          entity_id,
          action,
          payload_json
        )
        VALUES ($1, $2, $3, $4, $5::jsonb)
      `,
      [
        input.actorUserId,
        input.entityType,
        input.entityId,
        input.action,
        JSON.stringify(input.payloadJson),
      ],
    );
  }

  // Upserts product markdown and embedding into the vector index table.
  async upsertRagDocument(query: QueryExecutor, input: UpsertRagDocumentInput): Promise<void> {
    const embeddingVector = `[${input.embedding.map((value) => value.toFixed(6)).join(',')}]`;

    await query<QueryResultRow>(
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

  // Removes the vector document linked to a deleted or deactivated product.
  async deleteRagDocument(query: QueryExecutor, entityType: string, entityId: string): Promise<void> {
    await query<QueryResultRow>(
      `
        DELETE FROM rag_documents
        WHERE entity_type = $1
          AND entity_id = $2
      `,
      [entityType, entityId],
    );
  }

  // Reads one product snapshot using the provided transactional query executor.
  private async findProductByIdInQuery(
    query: QueryExecutor,
    productId: string,
  ): Promise<AdminProductSnapshot | null> {
    const rows = await query<AdminProductDatabaseRecord>(
      `
        SELECT
          p.id,
          p.slug,
          p.name,
          p.description,
          p.category,
          p.image_url,
          p.purchase_price_cents,
          p.price_cents AS sale_price_cents,
          p.weight_grams,
          COALESCE(i.quantity, 0) AS stock_quantity,
          p.is_active,
          p.created_at,
          p.updated_at
        FROM products p
        LEFT JOIN inventory i ON i.product_id = p.id
        WHERE p.id = $1
        LIMIT 1
      `,
      [productId],
    );

    const row = rows[0];
    return row ? this.mapProduct(row) : null;
  }

  // Maps product database fields to a normalized service snapshot object.
  private mapProduct(record: AdminProductDatabaseRecord): AdminProductSnapshot {
    return {
      id: record.id,
      slug: record.slug,
      name: record.name,
      description: record.description,
      category: record.category,
      imageUrl: record.image_url,
      purchasePriceCents: record.purchase_price_cents,
      salePriceCents: record.sale_price_cents,
      weightGrams: record.weight_grams,
      stockQuantity: record.stock_quantity,
      isActive: record.is_active,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }
}

