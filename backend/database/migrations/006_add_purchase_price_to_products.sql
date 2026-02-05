ALTER TABLE products
  ADD COLUMN IF NOT EXISTS purchase_price_cents INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_price_cents_positive'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_price_cents_positive;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_price_cents_non_negative'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_price_cents_non_negative CHECK (price_cents >= 0);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_purchase_price_cents_non_negative'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_purchase_price_cents_non_negative CHECK (purchase_price_cents >= 0);
  END IF;
END$$;
