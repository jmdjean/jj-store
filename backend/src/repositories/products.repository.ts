import { runQuery } from '../config/database.js';

export type ProductDatabaseRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  image_url: string | null;
  price_cents: number;
  weight_grams: number | null;
  stock_quantity: number;
  total_items?: number;
};

export type ProductQueryInput = {
  q: string | null;
  category: string | null;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  page: number;
  pageSize: number;
};

export type ProductListResult = {
  items: ProductDatabaseRecord[];
  totalItems: number;
};

export class ProductsRepository {
  async findMany(input: ProductQueryInput): Promise<ProductListResult> {
    const offset = (input.page - 1) * input.pageSize;

    const rows = await runQuery<ProductDatabaseRecord>(
      `
        SELECT
          p.id,
          p.slug,
          p.name,
          p.description,
          p.category,
          p.image_url,
          p.price_cents,
          p.weight_grams,
          COALESCE(i.quantity - i.reserved_quantity, 0) AS stock_quantity,
          COUNT(*) OVER()::int AS total_items
        FROM products p
        LEFT JOIN inventory i ON i.product_id = p.id
        WHERE p.is_active = TRUE
          AND (
            $1::text IS NULL
            OR p.name ILIKE '%' || $1 || '%'
            OR p.description ILIKE '%' || $1 || '%'
          )
          AND ($2::text IS NULL OR p.category = $2)
          AND ($3::int IS NULL OR p.price_cents >= $3)
          AND ($4::int IS NULL OR p.price_cents <= $4)
        ORDER BY p.name ASC
        LIMIT $5 OFFSET $6
      `,
      [input.q, input.category, input.minPriceCents, input.maxPriceCents, input.pageSize, offset],
    );

    const firstRow = rows[0];

    return {
      items: rows,
      totalItems: firstRow?.total_items ?? 0,
    };
  }

  async findById(productId: string): Promise<ProductDatabaseRecord | null> {
    const rows = await runQuery<ProductDatabaseRecord>(
      `
        SELECT
          p.id,
          p.slug,
          p.name,
          p.description,
          p.category,
          p.image_url,
          p.price_cents,
          p.weight_grams,
          COALESCE(i.quantity - i.reserved_quantity, 0) AS stock_quantity
        FROM products p
        LEFT JOIN inventory i ON i.product_id = p.id
        WHERE p.id = $1
          AND p.is_active = TRUE
        LIMIT 1
      `,
      [productId],
    );

    return rows[0] ?? null;
  }
}
