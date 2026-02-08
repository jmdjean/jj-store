import { AdminDashboardRepository } from '../repositories/admin-dashboard.repository.js';
import type {
  AdminDashboardSummary,
  AdminDashboardSummaryResponse,
} from './admin-dashboard.types.js';

const CATEGORY_LIMIT = 6;

type MonthRange = {
  from: string;
  to: string;
  label: string;
};

export class AdminDashboardService {
  constructor(private readonly adminDashboardRepository: AdminDashboardRepository) {}

  // Builds the admin dashboard summary with totals, categories, and comparison data.
  async getSummary(): Promise<AdminDashboardSummaryResponse> {
    const currentMonth = this.buildMonthRange(new Date());
    const previousMonth = this.buildMonthRange(this.addMonths(new Date(), -1));

    const [currentTotals, previousTotals, categories] = await Promise.all([
      this.adminDashboardRepository.getSalesTotals(currentMonth),
      this.adminDashboardRepository.getSalesTotals(previousMonth),
      this.adminDashboardRepository.getSalesByCategory(currentMonth, CATEGORY_LIMIT),
    ]);

    const summary: AdminDashboardSummary = {
      totalSales: currentTotals.totalSales,
      totalRevenueCents: currentTotals.totalRevenueCents,
      currentMonth: {
        label: currentMonth.label,
        totalSales: currentTotals.totalSales,
        totalRevenueCents: currentTotals.totalRevenueCents,
      },
      previousMonth: {
        label: previousMonth.label,
        totalSales: previousTotals.totalSales,
        totalRevenueCents: previousTotals.totalRevenueCents,
      },
      salesByCategory: categories,
    };

    return { data: summary };
  }

  // Builds a date range covering the entire month of the provided date.
  private buildMonthRange(date: Date): MonthRange {
    const year = date.getFullYear();
    const month = date.getMonth();
    const fromDate = new Date(year, month, 1);
    const toDate = new Date(year, month + 1, 0);

    return {
      from: this.formatDate(fromDate),
      to: this.formatDate(toDate),
      label: this.formatMonthLabel(fromDate),
    };
  }

  // Adds or subtracts months preserving the day when possible.
  private addMonths(date: Date, offset: number): Date {
    const nextDate = new Date(date);
    nextDate.setMonth(nextDate.getMonth() + offset);
    return nextDate;
  }

  // Formats date values into YYYY-MM-DD string for SQL filters.
  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  // Formats a month label in pt-BR for chart legends.
  private formatMonthLabel(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date);
  }
}
