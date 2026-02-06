import { runQuery } from '../config/database.js';

type DateRangeFilter = { from?: string; to?: string };

type SalesMetricsRow = {
  total_orders: string;
  total_revenue_cents: string;
  avg_order_value_cents: string;
  canceled_orders: string;
};

type ProductSalesRow = {
  product_id: string;
  product_name: string;
  product_category: string;
  total_sold: string;
  total_revenue_cents: string;
};

type OrderStatusCountRow = {
  status: string;
  total: string;
};

type CustomerMetricsRow = {
  total_customers: string;
  customers_with_orders: string;
};

type InventoryAlertRow = {
  product_id: string;
  product_name: string;
  category: string;
  stock_quantity: string;
};

export class SqlAnalyticsRepository {
  // Retrieves aggregated sales metrics for the given date range.
  async getSalesMetrics(dateRange?: DateRangeFilter): Promise<SalesMetricsRow[]> {
    return runQuery<SalesMetricsRow>(
      `
        SELECT
          COUNT(*)::text AS total_orders,
          COALESCE(SUM(total_amount_cents), 0)::text AS total_revenue_cents,
          COALESCE(ROUND(AVG(total_amount_cents)), 0)::text AS avg_order_value_cents,
          COUNT(*) FILTER (WHERE status = 'CANCELED')::text AS canceled_orders
        FROM orders
        WHERE ($1::date IS NULL OR created_at::date >= $1::date)
          AND ($2::date IS NULL OR created_at::date <= $2::date)
      `,
      [dateRange?.from ?? null, dateRange?.to ?? null],
    );
  }

  // Retrieves top-selling products with quantities and revenue for the date range.
  async getTopProducts(dateRange?: DateRangeFilter, limit = 10): Promise<ProductSalesRow[]> {
    return runQuery<ProductSalesRow>(
      `
        SELECT
          oi.product_id,
          oi.product_name,
          oi.product_category,
          SUM(oi.quantity)::text AS total_sold,
          SUM(oi.line_total_cents)::text AS total_revenue_cents
        FROM order_items oi
        INNER JOIN orders o ON o.id = oi.order_id
        WHERE o.status != 'CANCELED'
          AND ($1::date IS NULL OR o.created_at::date >= $1::date)
          AND ($2::date IS NULL OR o.created_at::date <= $2::date)
        GROUP BY oi.product_id, oi.product_name, oi.product_category
        ORDER BY SUM(oi.quantity) DESC
        LIMIT $3
      `,
      [dateRange?.from ?? null, dateRange?.to ?? null, limit],
    );
  }

  // Retrieves order counts grouped by status for the date range.
  async getOrderStatusCounts(dateRange?: DateRangeFilter): Promise<OrderStatusCountRow[]> {
    return runQuery<OrderStatusCountRow>(
      `
        SELECT
          status::text,
          COUNT(*)::text AS total
        FROM orders
        WHERE ($1::date IS NULL OR created_at::date >= $1::date)
          AND ($2::date IS NULL OR created_at::date <= $2::date)
        GROUP BY status
        ORDER BY total DESC
      `,
      [dateRange?.from ?? null, dateRange?.to ?? null],
    );
  }

  // Retrieves customer count metrics.
  async getCustomerMetrics(): Promise<CustomerMetricsRow[]> {
    return runQuery<CustomerMetricsRow>(
      `
        SELECT
          (SELECT COUNT(*)::text FROM customers_profile) AS total_customers,
          (SELECT COUNT(DISTINCT customer_id)::text FROM orders) AS customers_with_orders
      `,
    );
  }

  // Retrieves products with low stock for inventory alerts.
  async getLowStockProducts(threshold = 5): Promise<InventoryAlertRow[]> {
    return runQuery<InventoryAlertRow>(
      `
        SELECT
          p.id AS product_id,
          p.name AS product_name,
          p.category,
          COALESCE(i.quantity - i.reserved_quantity, 0)::text AS stock_quantity
        FROM products p
        LEFT JOIN inventory i ON i.product_id = p.id
        WHERE p.is_active = TRUE
          AND COALESCE(i.quantity - i.reserved_quantity, 0) <= $1
        ORDER BY COALESCE(i.quantity - i.reserved_quantity, 0) ASC
      `,
      [threshold],
    );
  }

  // Retrieves daily revenue for the date range.
  async getDailyRevenue(dateRange?: DateRangeFilter): Promise<Record<string, unknown>[]> {
    return runQuery<Record<string, unknown>>(
      `
        SELECT
          created_at::date::text AS date,
          COUNT(*)::text AS orders,
          COALESCE(SUM(total_amount_cents), 0)::text AS revenue_cents
        FROM orders
        WHERE status != 'CANCELED'
          AND ($1::date IS NULL OR created_at::date >= $1::date)
          AND ($2::date IS NULL OR created_at::date <= $2::date)
        GROUP BY created_at::date
        ORDER BY created_at::date DESC
      `,
      [dateRange?.from ?? null, dateRange?.to ?? null],
    );
  }
}
