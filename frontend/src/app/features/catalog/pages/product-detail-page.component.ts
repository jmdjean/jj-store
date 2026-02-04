import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreHeaderComponent } from '../components/store-header/store-header.component';
import { CatalogFacade } from '../facade/catalog.facade';
import { CartFacade } from '../../cart/facade/cart.facade';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [StoreHeaderComponent],
  templateUrl: './product-detail-page.component.html',
  styleUrl: './product-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly facade = inject(CatalogFacade);
  protected readonly cartFacade = inject(CartFacade);

  // Loads product details using the route parameter id.
  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!productId) {
      this.facade.detailError.set('Produto não encontrado.');
      return;
    }

    this.facade.loadProductDetail(productId).subscribe({
      error: (error: unknown) => {
        this.facade.detailError.set(
          this.facade.getApiErrorMessage(error, 'Não foi possível carregar o produto.'),
        );
      },
    });
  }

  // Redirects to catalog with an optional search query.
  protected onSearch(searchText: string): void {
    void this.router.navigate(['/'], {
      queryParams: searchText ? { q: searchText } : {},
    });
  }

  // Navigates back to the main catalog page.
  protected backToCatalog(): void {
    void this.router.navigateByUrl('/');
  }

  // Adds the selected product to cart when stock is available.
  protected addToCart(): void {
    const product = this.facade.selectedProduct();

    if (!product) {
      return;
    }

    this.cartFacade.addCatalogProduct(product);
  }

  // Formats numeric prices using Brazilian currency conventions.
  protected formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  }
}
