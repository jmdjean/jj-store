import { runQuery } from '../config/database.js';

export type SalesTotalsSnapshot = {
  totalSales: number;
  totalRevenueCents: number;
};

export type SalesByCategorySnapshot = {
  category: string;
  totalSales: number;
  totalRevenueCents: number;
};

type SalesTotalsRow = {
  total_sales: number;
  total_revenue_cents: number;
};

type SalesByCategoryRow = {
  category: string;
  total_sales: number;
  total_revenue_cents: number;
};

type DateRangeFilter = { from: string; to: string };

export class AdminDashboardRepository {
  // Retrieves order totals for the informed date range excluding canceled orders.
  async getSalesTotals(dateRange: DateRangeFilter): Promise<SalesTotalsSnapshot> {
    const rows = await runQuery<SalesTotalsRow>(
      `
        SELECT
          COUNT(*)::int AS total_sales,
          COALESCE(SUM(total_amount_cents), 0)::int AS total_revenue_cents
        FROM orders
        WHERE status != 'CANCELED'
          AND created_at::date >= $1::date
          AND created_at::date <= $2::date
      `,
      [dateRange.from, dateRange.to],
    );

    const row = rows[0];

    return {
      totalSales: row?.total_sales ?? 0,
      totalRevenueCents: row?.total_revenue_cents ?? 0,
    };
  }

  // Retrieves sales grouped by category for the informed date range.
  async getSalesByCategory(
    dateRange: DateRangeFilter,
    limit: number,
  ): Promise<SalesByCategorySnapshot[]> {
    const rows = await runQuery<SalesByCategoryRow>(
      `
        SELECT
          oi.product_category AS category,
          COUNT(*)::int AS total_sales,
          COALESCE(SUM(oi.line_total_cents), 0)::int AS total_revenue_cents
        FROM order_items oi
        INNER JOIN orders o ON o.id = oi.order_id
        WHERE o.status != 'CANCELED'
          AND o.created_at::date >= $1::date
          AND o.created_at::date <= $2::date
        GROUP BY oi.product_category
        ORDER BY total_sales DESC
        LIMIT $3
      `,
      [dateRange.from, dateRange.to, limit],
    );

    return rows.map((row) => ({
      category: row.category,
      totalSales: row.total_sales,
      totalRevenueCents: row.total_revenue_cents,
    }));
  }
}
