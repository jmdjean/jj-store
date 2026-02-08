export type AdminDashboardMonthSummary = {
  label: string;
  totalSales: number;
  totalRevenueCents: number;
};

export type AdminDashboardCategorySummary = {
  category: string;
  totalSales: number;
  totalRevenueCents: number;
};

export type AdminDashboardSummary = {
  totalSales: number;
  totalRevenueCents: number;
  currentMonth: AdminDashboardMonthSummary;
  previousMonth: AdminDashboardMonthSummary;
  salesByCategory: AdminDashboardCategorySummary[];
};

export type AdminDashboardSummaryResponse = {
  data: AdminDashboardSummary;
};
