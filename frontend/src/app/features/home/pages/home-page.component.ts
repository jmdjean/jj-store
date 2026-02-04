import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  protected readonly authService = inject(AuthService);
  protected readonly successMessage = signal('Ambiente inicial carregado com sucesso.');
  protected readonly errorMessage = signal('Não foi possível carregar os dados. Tente novamente.');

  // Ends the current authenticated session.
  protected logout(): void {
    this.authService.logout();
  }
}
