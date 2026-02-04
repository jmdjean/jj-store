import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import type { ApiErrorResponse } from '../../../core/models/auth.models';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly carregando = signal(false);
  protected readonly mensagemErro = signal('');

  protected readonly form = this.formBuilder.group({
    identificador: ['', [Validators.required]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensagemErro.set('Preencha os campos obrigatórios para continuar.');
      return;
    }

    const identificador = this.form.controls.identificador.value ?? '';
    const senha = this.form.controls.senha.value ?? '';
    this.carregando.set(true);
    this.mensagemErro.set('');

    this.authService
      .login({
        identificador,
        senha,
      })
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          const role = this.authService.role();
          const defaultRoute = role === 'ADMIN' || role === 'MANAGER' ? '/admin' : '/';
          void this.router.navigateByUrl(returnUrl || defaultRoute);
        },
        error: (error: unknown) => {
          this.mensagemErro.set(this.resolveApiErrorMessage(error));
        },
      });
  }

  protected get identificadorInvalido(): boolean {
    const control = this.form.controls.identificador;
    return control.invalid && (control.touched || control.dirty);
  }

  protected get senhaInvalida(): boolean {
    const control = this.form.controls.senha;
    return control.invalid && (control.touched || control.dirty);
  }

  private resolveApiErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Não foi possível realizar o login agora. Tente novamente.';
    }

    const apiError = error.error as ApiErrorResponse | undefined;
    return apiError?.mensagem ?? 'Não foi possível realizar o login agora. Tente novamente.';
  }
}
