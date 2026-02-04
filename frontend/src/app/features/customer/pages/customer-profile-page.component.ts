import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CustomerProfileFacade } from '../facade/customer-profile.facade';
import type { CustomerProfile, UpdateCustomerProfilePayload } from '../models/customer-profile.models';

@Component({
  selector: 'app-customer-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './customer-profile-page.component.html',
  styleUrl: './customer-profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerProfilePageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  protected readonly facade = inject(CustomerProfileFacade);

  protected readonly profileForm = this.formBuilder.nonNullable.group({
    cpf: [{ value: '', disabled: true }],
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    birthDate: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^\d{10,11}$/)]],
    street: ['', [Validators.required]],
    streetNumber: ['', [Validators.required]],
    neighborhood: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
    postalCode: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    complement: [''],
  });

  // Loads the customer profile when the page is initialized.
  ngOnInit(): void {
    this.facade.loadProfile().subscribe({
      next: (profile) => this.applyProfile(profile),
      error: (error: unknown) => {
        this.facade.profileError.set(
          this.facade.getApiErrorMessage(error, 'Não foi possível carregar seu perfil.'),
        );
      },
    });
  }

  // Validates and submits profile updates to the backend.
  protected saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.facade.saveError.set('Revise os campos obrigatórios antes de salvar.');
      return;
    }

    const payload = this.toUpdatePayload();

    this.facade.updateProfile(payload).subscribe({
      next: (response) => this.applyProfile(response.perfil),
      error: (error: unknown) => {
        this.facade.saveError.set(
          this.facade.getApiErrorMessage(error, 'Não foi possível atualizar seu perfil.'),
        );
      },
    });
  }

  // Checks whether a specific form control should display an error.
  protected hasError(controlName: keyof typeof this.profileForm.controls): boolean {
    const control = this.profileForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  // Applies profile data to the reactive form controls.
  private applyProfile(profile: CustomerProfile): void {
    this.profileForm.patchValue({
      cpf: profile.cpf,
      fullName: profile.fullName,
      birthDate: profile.birthDate,
      email: profile.email,
      phone: profile.phone ?? '',
      street: profile.address.street,
      streetNumber: profile.address.streetNumber,
      neighborhood: profile.address.neighborhood,
      city: profile.address.city,
      state: profile.address.state,
      postalCode: profile.address.postalCode,
      complement: profile.address.complement ?? '',
    });
  }

  // Maps form values to the profile update payload format.
  private toUpdatePayload(): UpdateCustomerProfilePayload {
    const values = this.profileForm.getRawValue();

    return {
      fullName: values.fullName.trim(),
      birthDate: values.birthDate,
      email: values.email.trim(),
      phone: values.phone.trim() || undefined,
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
