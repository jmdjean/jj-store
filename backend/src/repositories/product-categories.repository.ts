import { runQuery, type QueryExecutor } from '../config/database.js';

export type ProductCategoryRecord = {
  id: string;
  name: string;
  slug: string | null;
};

export type ProductCategorySnapshot = {
  id: string;
  name: string;
  slug: string | null;
};

export class ProductCategoriesRepository {
  // Lists all product categories ordered by name.
  async listCategories(): Promise<ProductCategorySnapshot[]> {
    const rows = await runQuery<ProductCategoryRecord>(
      `
        SELECT
          id,
          name,
          slug
        FROM product_categories
        ORDER BY name ASC
      `,
    );

    return rows.map((row) => this.mapCategory(row));
  }

  // Finds one category by identifier within the provided query context.
  async findById(
    query: QueryExecutor,
    categoryId: string,
  ): Promise<ProductCategorySnapshot | null> {
    const rows = await query<ProductCategoryRecord>(
      `
        SELECT
          id,
          name,
          slug
        FROM product_categories
        WHERE id = $1
        LIMIT 1
      `,
      [categoryId],
    );

    const row = rows[0];
    return row ? this.mapCategory(row) : null;
  }

  // Maps database category rows into repository snapshot objects.
  private mapCategory(record: ProductCategoryRecord): ProductCategorySnapshot {
    return {
      id: record.id,
      name: record.name,
      slug: record.slug,
    };
  }
}
