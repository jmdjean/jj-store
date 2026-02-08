import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { AdminDashboardApiService } from '../services/admin-dashboard-api.service';
import type { AdminDashboardSummary } from '../models/admin-dashboard.models';
import type { ApiErrorResponse } from '../models/admin-products.models';

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardFacade {
  private readonly dashboardApiService = inject(AdminDashboardApiService);
  private readonly summarySignal = signal<AdminDashboardSummary | null>(null);

  readonly summary = this.summarySignal.asReadonly();
  readonly loading = signal(false);
  readonly error = signal('');

  // Loads the dashboard summary and updates state.
  loadSummary() {
    this.loading.set(true);
    this.error.set('');

    return this.dashboardApiService.getSummary().pipe(
      tap((response) => this.summarySignal.set(response.data)),
      finalize(() => this.loading.set(false)),
    );
  }

  // Formats API errors into a pt-BR message.
  getApiErrorMessage(error: unknown, fallbackMessage: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    const apiError = error.error as ApiErrorResponse | undefined;
    return apiError?.mensagem ?? fallbackMessage;
  }
}
