import type { QueryResultRow } from 'pg';
import type { QueryExecutor } from '../config/database.js';

type CustomerAddressRecord = {
  street: string;
  street_number: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  complement: string | null;
};

type CheckoutProductRecord = {
  id: string;
  name: string;
  category: string;
  price_cents: number;
  available_quantity: number;
};

type OrderRecord = {
  id: string;
};

type InventoryUpdateRecord = {
  product_id: string;
};

export type CustomerAddressSnapshot = {
  street: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  complement: string | null;
};

export type CheckoutProductSnapshot = {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  availableQuantity: number;
};

export type CreateOrderInput = {
  customerId: string;
  totalAmountCents: number;
  itemsCount: number;
  address: CustomerAddressSnapshot;
};

export type CreateOrderItemInput = {
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

export class CartRepository {
  // Finds the saved customer address to use as checkout default.
  async findCustomerAddress(
    query: QueryExecutor,
    customerId: string,
  ): Promise<CustomerAddressSnapshot | null> {
    const rows = await query<CustomerAddressRecord>(
      `
        SELECT
          street,
          street_number,
          neighborhood,
          city,
          state,
          postal_code,
          complement
        FROM customers_profile
        WHERE user_id = $1
        LIMIT 1
      `,
      [customerId],
    );

    const address = rows[0];

    if (!address) {
      return null;
    }

    return this.mapAddress(address);
  }

  // Locks inventory rows and returns product snapshots for checkout pricing.
  async lockProductsForCheckout(
    query: QueryExecutor,
    productIds: string[],
  ): Promise<CheckoutProductSnapshot[]> {
    const rows = await query<CheckoutProductRecord>(
      `
        SELECT
          p.id,
          p.name,
          p.category,
          p.price_cents,
          (i.quantity - i.reserved_quantity) AS available_quantity
        FROM products p
        INNER JOIN inventory i ON i.product_id = p.id
        WHERE p.id = ANY($1::uuid[])
          AND p.is_active = TRUE
        FOR UPDATE OF i
      `,
      [productIds],
    );

    return rows.map((row) => this.mapProduct(row));
  }

  // Creates an order row and returns the generated identifier.
  async createOrder(query: QueryExecutor, input: CreateOrderInput): Promise<string> {
    const rows = await query<OrderRecord>(
      `
        INSERT INTO orders (
          customer_id,
          status,
          total_amount_cents,
          items_count,
          shipping_street,
          shipping_street_number,
          shipping_neighborhood,
          shipping_city,
          shipping_state,
          shipping_postal_code,
          shipping_complement
        )
        VALUES (
          $1,
          'CREATED',
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10
        )
        RETURNING id
      `,
      [
        input.customerId,
        input.totalAmountCents,
        input.itemsCount,
        input.address.street,
        input.address.streetNumber,
        input.address.neighborhood,
        input.address.city,
        input.address.state,
        input.address.postalCode,
        input.address.complement,
      ],
    );

    return rows[0].id;
  }

  // Persists a snapshot order item with fixed quantity and price.
  async createOrderItem(query: QueryExecutor, input: CreateOrderItemInput): Promise<string> {
    const rows = await query<QueryResultRow & { id: string }>(
      `
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          product_category,
          unit_price_cents,
          quantity,
          line_total_cents
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [
        input.orderId,
        input.productId,
        input.productName,
        input.productCategory,
        input.unitPriceCents,
        input.quantity,
        input.lineTotalCents,
      ],
    );

    return rows[0].id;
  }

  // Decreases stock quantity for a product and confirms the update happened.
  async decrementInventory(query: QueryExecutor, productId: string, quantity: number): Promise<boolean> {
    const rows = await query<InventoryUpdateRecord>(
      `
        UPDATE inventory
        SET
          quantity = quantity - $2,
          updated_at = NOW()
        WHERE product_id = $1
          AND quantity - reserved_quantity >= $2
        RETURNING product_id
      `,
      [productId, quantity],
    );

    return rows.length > 0;
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

  // Maps database address fields to the service snapshot structure.
  private mapAddress(record: CustomerAddressRecord): CustomerAddressSnapshot {
    return {
      street: record.street,
      streetNumber: record.street_number,
      neighborhood: record.neighborhood,
      city: record.city,
      state: record.state,
      postalCode: record.postal_code,
      complement: record.complement,
    };
  }

  // Maps checkout product rows to a normalized service-friendly format.
  private mapProduct(record: CheckoutProductRecord): CheckoutProductSnapshot {
    return {
      id: record.id,
      name: record.name,
      category: record.category,
      priceCents: record.price_cents,
      availableQuantity: record.available_quantity,
    };
  }
}
