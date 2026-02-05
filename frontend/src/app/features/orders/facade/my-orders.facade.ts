import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import type {
  ApiErrorResponse,
  ListMyOrdersResponse,
  MyOrderDetail,
  MyOrderSummary,
  OrderStatus,
  PaginationMeta,
} from '../models/orders.models';
import { OrdersApiService } from '../services/orders-api.service';

const DEFAULT_PAGE_SIZE = 10;

@Injectable({
  providedIn: 'root',
})
export class MyOrdersFacade {
  private readonly ordersApiService = inject(OrdersApiService);
  private readonly ordersSignal = signal<MyOrderSummary[]>([]);
  private readonly selectedOrderSignal = signal<MyOrderDetail | null>(null);
  private readonly paginationMetaSignal = signal<PaginationMeta>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  });
  private readonly cancelingOrderIdsSignal = signal<Record<string, boolean>>({});

  readonly orders = computed(() => this.ordersSignal());
  readonly selectedOrder = computed(() => this.selectedOrderSignal());
  readonly paginationMeta = computed(() => this.paginationMetaSignal());
  readonly loading = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');
  readonly detailLoading = signal(false);
  readonly detailError = signal('');

  // Loads paginated customer orders and updates facade state.
  loadOrders(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    this.loading.set(true);
    this.error.set('');
    this.successMessage.set('');

    return this.ordersApiService.getOrders(page, pageSize).pipe(
      tap((response: ListMyOrdersResponse) => {
        this.ordersSignal.set(response.data);
        this.paginationMetaSignal.set(response.meta);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  // Loads one order detail and stores it for detail view consumption.
  loadOrderById(orderId: string) {
    this.detailLoading.set(true);
    this.detailError.set('');

    return this.ordersApiService.getOrderById(orderId).pipe(
      tap((order: MyOrderDetail) => this.selectedOrderSignal.set(order)),
      finalize(() => this.detailLoading.set(false)),
    );
  }

  // Cancels an eligible order and applies local status updates.
  cancelOrder(orderId: string) {
    this.error.set('');
    this.successMessage.set('');
    this.updateCancelingState(orderId, true);

    return this.ordersApiService.cancelOrder(orderId).pipe(
      tap((response) => {
        this.successMessage.set(response.mensagem);
        this.ordersSignal.set(
          this.ordersSignal().map((order) =>
            order.id === orderId ? { ...order, status: 'CANCELED', canCancel: false } : order,
          ),
        );

        const currentDetail = this.selectedOrderSignal();

        if (currentDetail?.id === orderId) {
          this.selectedOrderSignal.set({
            ...currentDetail,
            status: 'CANCELED',
            canCancel: false,
          });
        }
      }),
      finalize(() => this.updateCancelingState(orderId, false)),
    );
  }

  // Returns whether the cancel request is running for a specific order.
  isCanceling(orderId: string): boolean {
    return Boolean(this.cancelingOrderIdsSignal()[orderId]);
  }

  // Returns a pt-BR label for each supported order status.
  getStatusLabel(status: OrderStatus): string {
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

  // Returns a semantic CSS suffix for status badge styling.
  getStatusClass(status: OrderStatus): string {
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

  // Formats backend/API errors into user-friendly pt-BR messages.
  getApiErrorMessage(error: unknown, fallbackMessage: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    const apiError = error.error as ApiErrorResponse | undefined;
    return apiError?.mensagem ?? fallbackMessage;
  }

  // Sets order-specific cancel loading state in a controlled way.
  private updateCancelingState(orderId: string, isLoading: boolean): void {
    const currentState = this.cancelingOrderIdsSignal();

    this.cancelingOrderIdsSignal.set({
      ...currentState,
      [orderId]: isLoading,
    });
  }
}
