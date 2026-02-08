CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80) NOT NULL UNIQUE,
  slug VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);

INSERT INTO product_categories (name, slug)
SELECT DISTINCT
  p.category,
  LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(p.category, '[^a-zA-Z0-9\\s-]', '', 'g'),
      '\\s+',
      '-',
      'g'
    )
  )
FROM products p
WHERE p.category IS NOT NULL
  AND p.category <> ''
ON CONFLICT (name) DO NOTHING;

UPDATE products
SET category_id = pc.id
FROM product_categories pc
WHERE products.category_id IS NULL
  AND products.category = pc.name;

ALTER TABLE products
  ALTER COLUMN category_id SET NOT NULL;
