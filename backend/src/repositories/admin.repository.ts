import type { QueryResultRow } from 'pg';
import { runQuery, type QueryExecutor } from '../config/database.js';
import type { AdminOrderStatus } from '../services/admin.types.js';

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



type AdminOrderDatabaseRecord = {
  id: string;
  customer_id: string;
  customer_name: string | null;
  customer_email: string | null;
  status: AdminOrderStatus;
  currency_code: string;
  total_amount_cents: number;
  items_count: number;
  shipping_street: string;
  shipping_street_number: string;
  shipping_neighborhood: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_complement: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type AdminOrderItemDatabaseRecord = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
};

export type AdminOrderItemSnapshot = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productCategory: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type AdminOrderSnapshot = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  status: AdminOrderStatus;
  currencyCode: string;
  totalAmountCents: number;
  itemsCount: number;
  shippingStreet: string;
  shippingStreetNumber: string;
  shippingNeighborhood: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingComplement: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminOrdersQueryInput = {
  status: AdminOrderStatus | 'all';
  customer: string | null;
  fromDate: string | null;
  toDate: string | null;
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



  // Lists orders with optional status, date range, and customer filters.
  async listOrders(input: AdminOrdersQueryInput): Promise<AdminOrderSnapshot[]> {
    const rows = await runQuery<AdminOrderDatabaseRecord>(
      `
        SELECT
          o.id,
          o.customer_id,
          cp.full_name AS customer_name,
          u.email AS customer_email,
          o.status,
          o.currency_code,
          o.total_amount_cents,
          o.items_count,
          o.shipping_street,
          o.shipping_street_number,
          o.shipping_neighborhood,
          o.shipping_city,
          o.shipping_state,
          o.shipping_postal_code,
          o.shipping_complement,
          o.created_at,
          o.updated_at
        FROM orders o
        INNER JOIN users u ON u.id = o.customer_id
        LEFT JOIN customers_profile cp ON cp.user_id = o.customer_id
        WHERE
          ($1::text = 'all' OR o.status = $1::order_status)
          AND ($2::text IS NULL OR cp.full_name ILIKE '%' || $2 || '%' OR u.email ILIKE '%' || $2 || '%')
          AND ($3::date IS NULL OR o.created_at::date >= $3::date)
          AND ($4::date IS NULL OR o.created_at::date <= $4::date)
        ORDER BY o.created_at DESC
      `,
      [input.status, input.customer, input.fromDate, input.toDate],
    );

    return rows.map((row) => this.mapOrder(row));
  }

  // Loads all snapshot items for each order ID in a single query.
  async listOrderItemsByOrderIds(orderIds: string[]): Promise<AdminOrderItemSnapshot[]> {
    if (orderIds.length === 0) {
      return [];
    }

    const rows = await runQuery<AdminOrderItemDatabaseRecord>(
      `
        SELECT
          id,
          order_id,
          product_id,
          product_name,
          product_category,
          unit_price_cents,
          quantity,
          line_total_cents
        FROM order_items
        WHERE order_id = ANY($1::uuid[])
        ORDER BY created_at ASC
      `,
      [orderIds],
    );

    return rows.map((row) => this.mapOrderItem(row));
  }

  // Finds one order by identifier inside the current transaction.
  async findOrderById(query: QueryExecutor, orderId: string, lockForUpdate = false): Promise<AdminOrderSnapshot | null> {
    const lockClause = lockForUpdate ? 'FOR UPDATE' : '';
    const rows = await query<AdminOrderDatabaseRecord>(
      `
        SELECT
          o.id,
          o.customer_id,
          cp.full_name AS customer_name,
          u.email AS customer_email,
          o.status,
          o.currency_code,
          o.total_amount_cents,
          o.items_count,
          o.shipping_street,
          o.shipping_street_number,
          o.shipping_neighborhood,
          o.shipping_city,
          o.shipping_state,
          o.shipping_postal_code,
          o.shipping_complement,
          o.created_at,
          o.updated_at
        FROM orders o
        INNER JOIN users u ON u.id = o.customer_id
        LEFT JOIN customers_profile cp ON cp.user_id = o.customer_id
        WHERE o.id = $1
        ${lockClause}
        LIMIT 1
      `,
      [orderId],
    );

    const row = rows[0];
    return row ? this.mapOrder(row) : null;
  }

  // Loads all snapshot items from the provided order ID in transaction scope.
  async listOrderItems(query: QueryExecutor, orderId: string): Promise<AdminOrderItemSnapshot[]> {
    const rows = await query<AdminOrderItemDatabaseRecord>(
      `
        SELECT
          id,
          order_id,
          product_id,
          product_name,
          product_category,
          unit_price_cents,
          quantity,
          line_total_cents
        FROM order_items
        WHERE order_id = $1
        ORDER BY created_at ASC
      `,
      [orderId],
    );

    return rows.map((row) => this.mapOrderItem(row));
  }

  // Updates order status and returns the refreshed order snapshot.
  async updateOrderStatus(query: QueryExecutor, orderId: string, status: AdminOrderStatus): Promise<AdminOrderSnapshot> {
    const rows = await query<AdminOrderDatabaseRecord>(
      `
        UPDATE orders o
        SET status = $2, updated_at = NOW()
        FROM users u
        LEFT JOIN customers_profile cp ON cp.user_id = u.id
        WHERE o.id = $1
          AND u.id = o.customer_id
        RETURNING
          o.id,
          o.customer_id,
          cp.full_name AS customer_name,
          u.email AS customer_email,
          o.status,
          o.currency_code,
          o.total_amount_cents,
          o.items_count,
          o.shipping_street,
          o.shipping_street_number,
          o.shipping_neighborhood,
          o.shipping_city,
          o.shipping_state,
          o.shipping_postal_code,
          o.shipping_complement,
          o.created_at,
          o.updated_at
      `,
      [orderId, status],
    );

    return this.mapOrder(rows[0]);
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



  // Maps order database fields to a normalized admin order snapshot.
  private mapOrder(record: AdminOrderDatabaseRecord): AdminOrderSnapshot {
    return {
      id: record.id,
      customerId: record.customer_id,
      customerName: record.customer_name ?? 'Cliente sem nome',
      customerEmail: record.customer_email,
      status: record.status,
      currencyCode: record.currency_code,
      totalAmountCents: record.total_amount_cents,
      itemsCount: record.items_count,
      shippingStreet: record.shipping_street,
      shippingStreetNumber: record.shipping_street_number,
      shippingNeighborhood: record.shipping_neighborhood,
      shippingCity: record.shipping_city,
      shippingState: record.shipping_state,
      shippingPostalCode: record.shipping_postal_code,
      shippingComplement: record.shipping_complement,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  // Maps order item database fields to a normalized snapshot object.
  private mapOrderItem(record: AdminOrderItemDatabaseRecord): AdminOrderItemSnapshot {
    return {
      id: record.id,
      orderId: record.order_id,
      productId: record.product_id,
      productName: record.product_name,
      productCategory: record.product_category,
      unitPriceCents: record.unit_price_cents,
      quantity: record.quantity,
      lineTotalCents: record.line_total_cents,
    };
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

