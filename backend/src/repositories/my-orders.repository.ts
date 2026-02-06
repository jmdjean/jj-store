import type { QueryResultRow } from 'pg';
import type { QueryExecutor } from '../config/database.js';
import type { OrderStatus } from '../services/my-orders.types.js';

type OrderRecord = {
  id: string;
  status: OrderStatus;
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

type OrderItemRecord = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
};

type CountRecord = {
  total: string;
};

type InventoryUpdateRecord = {
  product_id: string;
};

export type OrderSnapshot = {
  id: string;
  status: OrderStatus;
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

export type OrderItemSnapshot = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productCategory: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type UpsertRagDocumentInput = {
  entityType: string;
  entityId: string;
  contentMarkdown: string;
  embedding: number[];
  sourceUpdatedAt?: string | null;
  metadataJson: Record<string, unknown>;
};

export type CreateAuditLogInput = {
  actorUserId: string;
  entityType: string;
  entityId: string;
  action: string;
  payloadJson: Record<string, unknown>;
};

export class MyOrdersRepository {
  // Lists orders from a customer sorted by creation date descending.
  async listOrders(
    query: QueryExecutor,
    customerId: string,
    limit: number,
    offset: number,
  ): Promise<OrderSnapshot[]> {
    const rows = await query<OrderRecord>(
      `
        SELECT
          id,
          status,
          currency_code,
          total_amount_cents,
          items_count,
          shipping_street,
          shipping_street_number,
          shipping_neighborhood,
          shipping_city,
          shipping_state,
          shipping_postal_code,
          shipping_complement,
          created_at,
          updated_at
        FROM orders
        WHERE customer_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        OFFSET $3
      `,
      [customerId, limit, offset],
    );

    return rows.map((row) => this.mapOrder(row));
  }

  // Counts all orders owned by a specific customer.
  async countOrders(query: QueryExecutor, customerId: string): Promise<number> {
    const rows = await query<CountRecord>(
      `
        SELECT COUNT(*)::text AS total
        FROM orders
        WHERE customer_id = $1
      `,
      [customerId],
    );

    return Number(rows[0]?.total ?? 0);
  }

  // Finds one order by ID and customer ownership with optional row locking.
  async findOrderById(
    query: QueryExecutor,
    customerId: string,
    orderId: string,
    lockForUpdate = false,
  ): Promise<OrderSnapshot | null> {
    const lockClause = lockForUpdate ? 'FOR UPDATE' : '';
    const rows = await query<OrderRecord>(
      `
        SELECT
          id,
          status,
          currency_code,
          total_amount_cents,
          items_count,
          shipping_street,
          shipping_street_number,
          shipping_neighborhood,
          shipping_city,
          shipping_state,
          shipping_postal_code,
          shipping_complement,
          created_at,
          updated_at
        FROM orders
        WHERE id = $1
          AND customer_id = $2
        ${lockClause}
        LIMIT 1
      `,
      [orderId, customerId],
    );

    const row = rows[0];

    if (!row) {
      return null;
    }

    return this.mapOrder(row);
  }

  // Loads all snapshot items from a given order.
  async listOrderItems(query: QueryExecutor, orderId: string): Promise<OrderItemSnapshot[]> {
    const rows = await query<OrderItemRecord>(
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

  // Updates the order status and refreshes the update timestamp.
  async updateOrderStatus(
    query: QueryExecutor,
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderSnapshot> {
    const rows = await query<OrderRecord>(
      `
        UPDATE orders
        SET status = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          status,
          currency_code,
          total_amount_cents,
          items_count,
          shipping_street,
          shipping_street_number,
          shipping_neighborhood,
          shipping_city,
          shipping_state,
          shipping_postal_code,
          shipping_complement,
          created_at,
          updated_at
      `,
      [orderId, status],
    );

    return this.mapOrder(rows[0]);
  }

  // Restores inventory quantity for a canceled order item.
  async restoreInventory(query: QueryExecutor, productId: string, quantity: number): Promise<boolean> {
    const rows = await query<InventoryUpdateRecord>(
      `
        UPDATE inventory
        SET
          quantity = quantity + $2,
          updated_at = NOW()
        WHERE product_id = $1
        RETURNING product_id
      `,
      [productId, quantity],
    );

    return rows.length > 0;
  }

  // Inserts an audit trail entry describing the performed business action.
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

  // Upserts a vectorized document row linked to a business entity.
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

  // Maps raw order database columns to a normalized order snapshot.
  private mapOrder(record: OrderRecord): OrderSnapshot {
    return {
      id: record.id,
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

  // Maps raw order item columns to a normalized order item snapshot.
  private mapOrderItem(record: OrderItemRecord): OrderItemSnapshot {
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
}
