import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-home-page',
  standalone: true,
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  protected readonly successMessage = signal('Ambiente inicial carregado com sucesso.');
  protected readonly errorMessage = signal('Não foi possível carregar os dados. Tente novamente.');
}
