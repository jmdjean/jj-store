import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { RagApiService } from '../services/rag-api.service';
import type { RagEntityType, RagSearchResult } from '../models/rag.models';

@Component({
  selector: 'app-rag-search-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './rag-search-page.component.html',
  styleUrl: './rag-search-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RagSearchPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly ragApiService = inject(RagApiService);

  protected readonly isLoading = signal(false);
  protected readonly mensagem = signal('Digite uma pergunta para pesquisar.');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly results = signal<RagSearchResult[]>([]);

  protected readonly entityOptions: Array<{ value: RagEntityType; label: string }> = [
    { value: 'product', label: 'Produtos' },
    { value: 'customer', label: 'Clientes' },
    { value: 'manager', label: 'Gestores' },
    { value: 'order', label: 'Pedidos' },
    { value: 'order_item', label: 'Itens de pedido' },
  ];

  protected readonly searchForm = this.formBuilder.nonNullable.group({
    query: [''],
    topK: [5],
    product: [true],
    customer: [true],
    manager: [true],
    order: [true],
    orderItem: [true],
  });

  // Submits semantic query payload and updates UI state with ranked sources.
  protected submitSearch(): void {
    const query = this.searchForm.controls.query.value.trim();

    if (!query) {
      this.errorMessage.set('Digite uma pergunta para pesquisar.');
      this.results.set([]);
      return;
    }

    const selectedEntityTypes = this.resolveSelectedEntityTypes();
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.ragApiService
      .search({
        query,
        topK: this.searchForm.controls.topK.value,
        entityTypes: selectedEntityTypes,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.mensagem.set(response.mensagem);
          this.results.set(response.resultados);
        },
        error: () => {
          this.errorMessage.set('Não foi possível concluir a pesquisa RAG.');
          this.results.set([]);
        },
      });
  }

  // Resolves selected entity type filters from form checkboxes.
  private resolveSelectedEntityTypes(): RagEntityType[] {
    const selected: RagEntityType[] = [];

    if (this.searchForm.controls.product.value) {
      selected.push('product');
    }

    if (this.searchForm.controls.customer.value) {
      selected.push('customer');
    }

    if (this.searchForm.controls.manager.value) {
      selected.push('manager');
    }

    if (this.searchForm.controls.order.value) {
      selected.push('order');
    }

    if (this.searchForm.controls.orderItem.value) {
      selected.push('order_item');
    }

    return selected;
  }
}
