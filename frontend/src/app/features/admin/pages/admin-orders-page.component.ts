import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AdminOrdersFacade } from '../facade/admin-orders.facade';
import type { AdminOrder, AdminOrderStatus } from '../models/admin-orders.models';

@Component({
  selector: 'app-admin-orders-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-orders-page.component.html',
  styleUrl: './admin-orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrdersPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly adminOrdersFacade = inject(AdminOrdersFacade);
  protected readonly expandedOrderIds = signal<Record<string, boolean>>({});
  protected readonly savingOrderId = signal<string | null>(null);

  protected readonly filtersForm = this.formBuilder.nonNullable.group({
    customer: '',
    status: 'all' as AdminOrderStatus | 'all',
    fromDate: '',
    toDate: '',
  });

  // Loads the first admin orders list on component initialization.
  ngOnInit(): void {
    this.loadOrders();
  }

  // Applies current filter form values and reloads the order list.
  protected applyFilters(): void {
    const filters = this.filtersForm.getRawValue();

    this.loadOrders({
      customer: filters.customer,
      status: filters.status,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    });
  }

  // Clears order filters and loads all order statuses.
  protected clearFilters(): void {
    this.filtersForm.setValue({
      customer: '',
      status: 'all',
      fromDate: '',
      toDate: '',
    });

    this.loadOrders();
  }

  // Toggles one order detail panel visibility.
  protected toggleOrderDetails(orderId: string): void {
    this.expandedOrderIds.update((current) => ({
      ...current,
      [orderId]: !current[orderId],
    }));
  }

  // Returns whether details are currently expanded for one order row.
  protected isOrderExpanded(orderId: string): boolean {
    return Boolean(this.expandedOrderIds()[orderId]);
  }

  // Returns whether a specific order row is currently saving status.
  protected isSavingOrder(orderId: string): boolean {
    return this.savingOrderId() === orderId;
  }

  // Updates order status after a user confirmation step.
  protected saveStatus(order: AdminOrder, event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const nextStatus = selectElement.value as AdminOrderStatus;

    if (nextStatus === order.status) {
      return;
    }

    const confirmed = window.confirm('Deseja realmente atualizar o status deste pedido?');

    if (!confirmed) {
      selectElement.value = order.status;
      return;
    }

    this.savingOrderId.set(order.id);

    this.adminOrdersFacade
      .updateOrderStatus(order.id, nextStatus)
      .pipe(finalize(() => this.savingOrderId.set(null)))
      .subscribe({
        error: (error: unknown) => {
          selectElement.value = order.status;
          this.adminOrdersFacade.error.set(
            this.adminOrdersFacade.getApiErrorMessage(
              error,
              'Não foi possível atualizar o status do pedido. Tente novamente.',
            ),
          );
        },
      });
  }

  // Formats date-time values into pt-BR representation.
  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  // Formats integer cents as currency in pt-BR.
  protected formatCurrency(valueInCents: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valueInCents / 100);
  }

  // Loads admin orders and centralizes request error handling.
  private loadOrders(filters: {
    customer?: string;
    status?: AdminOrderStatus | 'all';
    fromDate?: string;
    toDate?: string;
  } = {}): void {
    this.adminOrdersFacade.loadOrders(filters).subscribe({
      error: (error: unknown) => {
        this.adminOrdersFacade.error.set(
          this.adminOrdersFacade.getApiErrorMessage(
            error,
            'Não foi possível carregar os pedidos. Tente novamente.',
          ),
        );
      },
    });
  }
}
