import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-store-header',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './store-header.component.html',
  styleUrl: './store-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreHeaderComponent {
  @Input({ required: true }) searchValue = '';
  @Input() cartItems = 0;

  @Output() readonly searchChange = new EventEmitter<string>();

  // Handles search form submission and emits the current search text.
  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.searchChange.emit(this.searchValue);
  }
}
