DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'order_status'
  ) THEN
    CREATE TYPE order_status AS ENUM ('CREATED', 'PAID', 'PICKING', 'SHIPPED', 'DELIVERED', 'CANCELED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status order_status NOT NULL DEFAULT 'CREATED',
  currency_code CHAR(3) NOT NULL DEFAULT 'BRL',
  total_amount_cents INTEGER NOT NULL,
  items_count INTEGER NOT NULL,
  shipping_street VARCHAR(160) NOT NULL,
  shipping_street_number VARCHAR(20) NOT NULL,
  shipping_neighborhood VARCHAR(120) NOT NULL,
  shipping_city VARCHAR(120) NOT NULL,
  shipping_state CHAR(2) NOT NULL,
  shipping_postal_code VARCHAR(8) NOT NULL,
  shipping_complement VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT orders_total_amount_non_negative CHECK (total_amount_cents >= 0),
  CONSTRAINT orders_items_count_positive CHECK (items_count > 0),
  CONSTRAINT orders_shipping_state_length CHECK (char_length(shipping_state) = 2),
  CONSTRAINT orders_shipping_postal_code_digits CHECK (shipping_postal_code ~ '^[0-9]{8}$')
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_created_at
  ON orders (customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(180) NOT NULL,
  product_category VARCHAR(80) NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  line_total_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT order_items_unit_price_non_negative CHECK (unit_price_cents >= 0),
  CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT order_items_line_total_non_negative CHECK (line_total_cents >= 0),
  CONSTRAINT order_items_order_product_unique UNIQUE (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON order_items (product_id);

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(40) NOT NULL,
  entity_id UUID NOT NULL,
  content_markdown TEXT NOT NULL,
  embedding VECTOR(8) NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rag_documents_entity_unique UNIQUE (entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_rag_documents_entity_type
  ON rag_documents (entity_type);

CREATE INDEX IF NOT EXISTS idx_rag_documents_updated_at
  ON rag_documents (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_rag_documents_embedding
  ON rag_documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 64);
