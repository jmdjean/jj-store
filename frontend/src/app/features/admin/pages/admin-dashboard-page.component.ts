import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { AdminDashboardFacade } from '../facade/admin-dashboard.facade';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPageComponent implements OnInit {
  protected readonly adminDashboardFacade = inject(AdminDashboardFacade);

  protected readonly chartData = computed(() => {
    const summary = this.adminDashboardFacade.summary();

    if (!summary) {
      return null;
    }

    const maxSales = Math.max(summary.currentMonth.totalSales, summary.previousMonth.totalSales, 1);

    return {
      maxSales,
      currentMonth: summary.currentMonth,
      previousMonth: summary.previousMonth,
    };
  });

  // Loads summary data on first page render.
  ngOnInit(): void {
    this.loadSummary();
  }

  // Retries dashboard summary loading after failures.
  protected retry(): void {
    this.loadSummary();
  }

  // Formats cent values into pt-BR currency strings.
  protected formatCurrency(valueCents: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valueCents / 100);
  }

  // Calculates bar height as percentage for chart visual comparison.
  protected getBarHeight(value: number, maxValue: number): string {
    if (maxValue <= 0) {
      return '0%';
    }

    return `${Math.round((value / maxValue) * 100)}%`;
  }

  // Triggers dashboard API load and handles error messaging.
  private loadSummary(): void {
    this.adminDashboardFacade.loadSummary().subscribe({
      error: (error) => {
        this.adminDashboardFacade.error.set(
          this.adminDashboardFacade.getApiErrorMessage(
            error,
            'Não foi possível carregar o dashboard. Tente novamente.',
          ),
        );
      },
    });
  }
}
