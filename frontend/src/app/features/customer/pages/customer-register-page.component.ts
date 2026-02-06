import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CpfMaskDirective } from '../../../core/directives/cpf-mask.directive';
import { PhoneMaskDirective } from '../../../core/directives/phone-mask.directive';
import { cpfValidator } from '../../../core/validators/cpf.validator';
import { phoneValidator } from '../../../core/validators/phone.validator';
import { CustomerProfileFacade } from '../facade/customer-profile.facade';
import type { RegisterCustomerPayload } from '../models/customer-profile.models';

@Component({
  selector: 'app-customer-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CpfMaskDirective, PhoneMaskDirective],
  templateUrl: './customer-register-page.component.html',
  styleUrl: './customer-register-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerRegisterPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly facade = inject(CustomerProfileFacade);

  protected readonly registerForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    cpf: ['', [Validators.required, cpfValidator()]],
    birthDate: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [phoneValidator()]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    street: ['', [Validators.required]],
    streetNumber: ['', [Validators.required]],
    neighborhood: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
    postalCode: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    complement: [''],
  });

  // Validates the form and sends a customer registration request.
  protected submit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.facade.registerError.set('Preencha os campos obrigatórios do cadastro.');
      return;
    }

    const payload = this.toRegisterPayload();

    this.facade.registerCustomer(payload).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/checkout';
        void this.router.navigate(['/login'], {
          queryParams: { returnUrl, registered: 'true' },
        });
      },
      error: (error: unknown) => {
        this.facade.registerError.set(
          this.facade.getApiErrorMessage(error, 'Não foi possível concluir o cadastro agora.'),
        );
      },
    });
  }

  // Returns query params to preserve returnUrl when navigating back to login.
  protected get loginQueryParams(): { returnUrl?: string } {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl ? { returnUrl } : {};
  }

  // Checks whether a specific form control should display an error.
  protected hasError(controlName: keyof typeof this.registerForm.controls): boolean {
    const control = this.registerForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  // Returns pt-BR validation message for a control (CPF, phone, email or generic).
  protected getControlMessage(controlName: keyof typeof this.registerForm.controls): string {
    const control = this.registerForm.controls[controlName];
    if (control.hasError('cpf') && control.getError('cpf')?.message) {
      return control.getError('cpf').message as string;
    }
    if (control.hasError('phone') && control.getError('phone')?.message) {
      return control.getError('phone').message as string;
    }
    if (control.hasError('email')) {
      return 'Informe um e-mail válido.';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório.';
    }
    if (control.hasError('minlength')) {
      return 'O valor informado é muito curto.';
    }
    return 'Valor inválido.';
  }

  // Maps the registration form values to the API payload structure.
  private toRegisterPayload(): RegisterCustomerPayload {
    const values = this.registerForm.getRawValue();

    return {
      fullName: values.fullName.trim(),
      cpf: (values.cpf ?? '').replace(/\D/g, ''),
      birthDate: values.birthDate,
      email: values.email.trim(),
      phone: (values.phone ?? '').replace(/\D/g, '').trim() || undefined,
      password: values.password,
      address: {
        street: values.street.trim(),
        streetNumber: values.streetNumber.trim(),
        neighborhood: values.neighborhood.trim(),
        city: values.city.trim(),
        state: values.state.trim().toUpperCase(),
        postalCode: values.postalCode.replace(/\D/g, ''),
        complement: values.complement.trim() || undefined,
      },
    };
  }
}
