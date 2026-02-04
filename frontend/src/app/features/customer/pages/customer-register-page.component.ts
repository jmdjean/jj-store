import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CustomerProfileFacade } from '../facade/customer-profile.facade';
import type { RegisterCustomerPayload } from '../models/customer-profile.models';

@Component({
  selector: 'app-customer-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './customer-register-page.component.html',
  styleUrl: './customer-register-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerRegisterPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  protected readonly facade = inject(CustomerProfileFacade);

  protected readonly registerForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    cpf: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
    birthDate: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^\d{10,11}$/)]],
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
      error: (error: unknown) => {
        this.facade.registerError.set(
          this.facade.getApiErrorMessage(error, 'Não foi possível concluir o cadastro agora.'),
        );
      },
    });
  }

  // Checks whether a specific form control should display an error.
  protected hasError(controlName: keyof typeof this.registerForm.controls): boolean {
    const control = this.registerForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  // Maps the registration form values to the API payload structure.
  private toRegisterPayload(): RegisterCustomerPayload {
    const values = this.registerForm.getRawValue();

    return {
      fullName: values.fullName.trim(),
      cpf: values.cpf.replace(/\D/g, ''),
      birthDate: values.birthDate,
      email: values.email.trim(),
      phone: values.phone.trim() || undefined,
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
