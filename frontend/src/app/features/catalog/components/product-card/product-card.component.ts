import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CatalogProduct } from '../../models/catalog.models';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: CatalogProduct;
  @Output() readonly addToCart = new EventEmitter<CatalogProduct>();

  // Formats product prices using the BRL currency locale.
  protected formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  }

  // Emits selected product data to parent components for cart insertion.
  protected addProductToCart(): void {
    this.addToCart.emit(this.product);
  }
}
