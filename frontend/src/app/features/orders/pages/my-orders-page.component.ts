import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StoreHeaderComponent } from '../../catalog/components/store-header/store-header.component';
import { MyOrdersFacade } from '../facade/my-orders.facade';

@Component({
  selector: 'app-my-orders-page',
  standalone: true,
  imports: [RouterLink, StoreHeaderComponent],
  templateUrl: './my-orders-page.component.html',
  styleUrl: './my-orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyOrdersPageComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly myOrdersFacade = inject(MyOrdersFacade);

  // Loads customer order history during page initialization.
  ngOnInit(): void {
    this.loadOrders(this.myOrdersFacade.paginationMeta().page);
  }

  // Redirects search requests to catalog query route.
  protected onSearch(searchText: string): void {
    void this.router.navigate(['/'], {
      queryParams: searchText ? { q: searchText } : {},
    });
  }

  // Loads orders for a selected page and handles API failures.
  protected loadOrders(page: number): void {
    this.myOrdersFacade.loadOrders(page).subscribe({
      error: (error: unknown) => {
        this.myOrdersFacade.error.set(
          this.myOrdersFacade.getApiErrorMessage(error, 'Não foi possível carregar suas compras.'),
        );
      },
    });
  }

  // Cancels an order after explicit user confirmation.
  protected cancelOrder(orderId: string): void {
    const userConfirmed = window.confirm('Tem certeza que deseja cancelar este pedido?');

    if (!userConfirmed) {
      return;
    }

    this.myOrdersFacade.cancelOrder(orderId).subscribe({
      error: (error: unknown) => {
        this.myOrdersFacade.error.set(
          this.myOrdersFacade.getApiErrorMessage(error, 'Não foi possível cancelar o pedido.'),
        );
      },
    });
  }

  // Formats an ISO timestamp into pt-BR local date and time.
  protected formatDate(dateIso: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(dateIso));
  }

  // Formats integer cents as pt-BR currency value.
  protected formatCurrency(valueInCents: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valueInCents / 100);
  }

  // Returns whether there is a previous page available.
  protected canGoToPreviousPage(): boolean {
    return this.myOrdersFacade.paginationMeta().page > 1;
  }

  // Returns whether there is a next page available.
  protected canGoToNextPage(): boolean {
    const meta = this.myOrdersFacade.paginationMeta();
    return meta.page < meta.totalPages;
  }

  // Loads the previous page when pagination allows it.
  protected goToPreviousPage(): void {
    if (!this.canGoToPreviousPage()) {
      return;
    }

    const previousPage = this.myOrdersFacade.paginationMeta().page - 1;
    this.loadOrders(previousPage);
  }

  // Loads the next page when pagination allows it.
  protected goToNextPage(): void {
    if (!this.canGoToNextPage()) {
      return;
    }

    const nextPage = this.myOrdersFacade.paginationMeta().page + 1;
    this.loadOrders(nextPage);
  }
}
