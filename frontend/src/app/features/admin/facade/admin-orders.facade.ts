import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import type {
  AdminOrder,
  AdminOrderStatus,
  AdminOrdersFilters,
  ApiErrorResponse,
} from '../models/admin-orders.models';
import { AdminOrdersApiService } from '../services/admin-orders-api.service';

const DEFAULT_FILTERS: AdminOrdersFilters = {
  status: 'all',
};

@Injectable({
  providedIn: 'root',
})
export class AdminOrdersFacade {
  private readonly adminOrdersApiService = inject(AdminOrdersApiService);
  private readonly ordersSignal = signal<AdminOrder[]>([]);
  private readonly filtersSignal = signal<AdminOrdersFilters>(DEFAULT_FILTERS);

  readonly orders = computed(() => this.ordersSignal());
  readonly filters = computed(() => this.filtersSignal());
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');

  // Loads admin orders and stores results in local feature state.
  loadOrders(partialFilters: AdminOrdersFilters = {}) {
    const nextFilters = this.normalizeFilters({
      ...this.filtersSignal(),
      ...partialFilters,
    });

    this.filtersSignal.set(nextFilters);
    this.loading.set(true);
    this.error.set('');

    return this.adminOrdersApiService.getOrders(nextFilters).pipe(
      tap((response) => this.ordersSignal.set(response.data)),
      finalize(() => this.loading.set(false)),
    );
  }

  // Updates one order status and syncs it in local listing state.
  updateOrderStatus(orderId: string, status: AdminOrderStatus) {
    this.saving.set(true);
    this.error.set('');
    this.successMessage.set('');

    return this.adminOrdersApiService.updateOrderStatus(orderId, { status }).pipe(
      tap((response) => {
        this.successMessage.set(response.mensagem);
        this.ordersSignal.set(
          this.ordersSignal().map((order) => (order.id === response.data.id ? response.data : order)),
        );
      }),
      finalize(() => this.saving.set(false)),
    );
  }

  // Returns a friendly pt-BR error message from API failures.
  getApiErrorMessage(error: unknown, fallbackMessage: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    const apiError = error.error as ApiErrorResponse | undefined;
    return apiError?.mensagem ?? fallbackMessage;
  }

  // Returns one pt-BR label per available order status.
  getStatusLabel(status: AdminOrderStatus): string {
    switch (status) {
      case 'CREATED':
        return 'Criado';
      case 'PAID':
        return 'Pago';
      case 'PICKING':
        return 'Separando';
      case 'SHIPPED':
        return 'Enviado';
      case 'DELIVERED':
        return 'Entregue';
      case 'CANCELED':
        return 'Cancelado';
      default:
        return status;
    }
  }

  // Returns one CSS semantic class suffix based on order status.
  getStatusClass(status: AdminOrderStatus): string {
    switch (status) {
      case 'CREATED':
        return 'created';
      case 'PAID':
        return 'paid';
      case 'PICKING':
        return 'picking';
      case 'SHIPPED':
        return 'shipped';
      case 'DELIVERED':
        return 'delivered';
      case 'CANCELED':
        return 'canceled';
      default:
        return 'created';
    }
  }

  // Normalizes text/date filter values and defaults status to all.
  private normalizeFilters(filters: AdminOrdersFilters): AdminOrdersFilters {
    return {
      status: filters.status ?? 'all',
      customer: filters.customer?.trim() || undefined,
      fromDate: filters.fromDate?.trim() || undefined,
      toDate: filters.toDate?.trim() || undefined,
    };
  }
}
