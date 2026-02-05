import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MyOrdersFacade } from '../facade/my-orders.facade';

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  templateUrl: './order-detail-page.component.html',
  styleUrl: './order-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly myOrdersFacade = inject(MyOrdersFacade);

  // Loads selected order detail from route parameter during initialization.
  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('orderId');

    if (!orderId) {
      this.myOrdersFacade.detailError.set('Pedido não encontrado.');
      return;
    }

    this.myOrdersFacade.loadOrderById(orderId).subscribe({
      error: (error: unknown) => {
        this.myOrdersFacade.detailError.set(
          this.myOrdersFacade.getApiErrorMessage(error, 'Não foi possível carregar os detalhes do pedido.'),
        );
      },
    });
  }

  // Cancels the current order after explicit user confirmation.
  protected cancelOrder(orderId: string): void {
    const userConfirmed = window.confirm('Tem certeza que deseja cancelar este pedido?');

    if (!userConfirmed) {
      return;
    }

    this.myOrdersFacade.cancelOrder(orderId).subscribe({
      error: (error: unknown) => {
        this.myOrdersFacade.detailError.set(
          this.myOrdersFacade.getApiErrorMessage(error, 'Não foi possível cancelar o pedido.'),
        );
      },
    });
  }

  // Navigates user back to the order listing page.
  protected backToOrders(): void {
    void this.router.navigateByUrl('/minhas-compras');
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
}
