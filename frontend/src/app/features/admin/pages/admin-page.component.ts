import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPageComponent {
  protected readonly authService = inject(AuthService);

  // Logs out current user and clears the persisted auth session.
  protected logout(): void {
    this.authService.logout();
  }
}
