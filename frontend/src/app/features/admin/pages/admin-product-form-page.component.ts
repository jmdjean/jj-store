import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { CurrencyMaskDirective } from '../../../core/directives/currency-mask.directive';
import { AdminProductsFacade } from '../facade/admin-products.facade';
import { AdminProductCategoriesFacade } from '../facade/admin-product-categories.facade';
import type { AdminProduct, AdminProductPayload } from '../models/admin-products.models';

@Component({
  selector: 'app-admin-product-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CurrencyMaskDirective],
  templateUrl: './admin-product-form-page.component.html',
  styleUrl: './admin-product-form-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProductFormPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly adminProductsFacade = inject(AdminProductsFacade);
  protected readonly adminProductCategoriesFacade = inject(AdminProductCategoriesFacade);
  protected readonly productId = signal<string | null>(null);
  protected readonly categorySearch = signal('');

  protected readonly isEditMode = computed(() => Boolean(this.productId()));
  protected readonly filteredCategories = computed(() => {
    const searchValue = this.categorySearch().trim().toLowerCase();
    const categories = this.adminProductCategoriesFacade.categories();

    if (!searchValue) {
      return categories;
    }

    return categories.filter((category) => category.name.toLowerCase().includes(searchValue));
  });

  protected readonly productForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(180)]],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    categoryId: ['', [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    weightGrams: [null as number | null, [Validators.min(0)]],
    purchasePrice: [0, [Validators.required, Validators.min(0)]],
    salePrice: [0, [Validators.required, Validators.min(0)]],
    imageUrl: [''],
  });

  // Reads route params and preloads product data when editing.
  ngOnInit(): void {
    this.loadCategories();
    const currentProductId = this.route.snapshot.paramMap.get('id');

    if (!currentProductId) {
      return;
    }

    this.productId.set(currentProductId);
    this.loadProductForEdition(currentProductId);
  }

  // Submits create or update request according to current form mode.
  protected saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();

    if (!payload) {
      return;
    }

    this.productForm.disable();

    if (this.isEditMode()) {
      this.updateProduct(payload);
      return;
    }

    this.createProduct(payload);
  }

  // Returns whether a field has validation errors after interaction.
  protected hasFieldError(fieldName: keyof typeof this.productForm.controls): boolean {
    const field = this.productForm.controls[fieldName];
    return field.invalid && (field.dirty || field.touched);
  }

  // Returns a pt-BR validation message for known form field errors.
  protected getFieldError(fieldName: keyof typeof this.productForm.controls): string {
    const field = this.productForm.controls[fieldName];

    if (field.hasError('required')) {
      return 'Campo obrigatório.';
    }

    if (field.hasError('min')) {
      return 'Informe um valor maior ou igual a zero.';
    }

    if (field.hasError('maxlength')) {
      return 'O valor informado ultrapassa o limite permitido.';
    }

    return 'Valor inválido.';
  }

  // Loads an existing product and patches the form for editing.
  private loadProductForEdition(productId: string): void {
    this.adminProductsFacade.loadProductById(productId).subscribe({
      next: (response) => {
        this.patchForm(response.data);
      },
      error: (error) => {
        this.adminProductsFacade.error.set(
          this.adminProductsFacade.getApiErrorMessage(
            error,
            'Não foi possível carregar os dados do produto. Tente novamente.',
          ),
        );
      },
    });
  }

  // Loads available product categories to populate the combo list.
  private loadCategories(): void {
    this.adminProductCategoriesFacade.loadCategories().subscribe({
      error: (error) => {
        this.adminProductCategoriesFacade.error.set(
          this.adminProductCategoriesFacade.getApiErrorMessage(
            error,
            'Não foi possível carregar as categorias. Tente novamente.',
          ),
        );
      },
    });
  }

  // Builds API payload from typed form values.
  private buildPayload(): AdminProductPayload | null {
    const formValue = this.productForm.getRawValue();

    if (!formValue.name || !formValue.description || !formValue.categoryId) {
      return null;
    }

    return {
      name: formValue.name,
      description: formValue.description,
      categoryId: formValue.categoryId,
      quantity: formValue.quantity,
      weightGrams: formValue.weightGrams,
      purchasePrice: formValue.purchasePrice,
      salePrice: formValue.salePrice,
      imageUrl: formValue.imageUrl.trim() || null,
    };
  }

  // Sends create request and navigates back to listing after success.
  private createProduct(payload: AdminProductPayload): void {
    this.adminProductsFacade
      .createProduct(payload)
      .pipe(finalize(() => this.productForm.enable()))
      .subscribe({
        next: () => {
          this.router.navigate(['/admin/produtos']);
        },
        error: (error) => {
          this.adminProductsFacade.error.set(
            this.adminProductsFacade.getApiErrorMessage(
              error,
              'Não foi possível salvar o produto. Tente novamente.',
            ),
          );
        },
      });
  }

  // Sends update request and navigates back to listing after success.
  private updateProduct(payload: AdminProductPayload): void {
    const currentProductId = this.productId();

    if (!currentProductId) {
      return;
    }

    this.adminProductsFacade
      .updateProduct(currentProductId, payload)
      .pipe(finalize(() => this.productForm.enable()))
      .subscribe({
        next: () => {
          this.router.navigate(['/admin/produtos']);
        },
        error: (error) => {
          this.adminProductsFacade.error.set(
            this.adminProductsFacade.getApiErrorMessage(
              error,
              'Não foi possível atualizar o produto. Tente novamente.',
            ),
          );
        },
      });
  }

  // Applies product fields to the form controls for edit mode.
  private patchForm(product: AdminProduct): void {
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      quantity: product.stockQuantity,
      weightGrams: product.weightGrams,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      imageUrl: product.imageUrl ?? '',
    });

    this.categorySearch.set(product.categoryName);
  }

  // Updates category search input to filter the combo list.
  protected updateCategorySearch(value: string): void {
    this.categorySearch.set(value);
  }
}
