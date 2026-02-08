import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { StoreHeaderComponent } from '../../catalog/components/store-header/store-header.component';
import { PhoneMaskDirective } from '../../../core/directives/phone-mask.directive';
import { phoneValidator } from '../../../core/validators/phone.validator';
import { CustomerProfileFacade } from '../facade/customer-profile.facade';
import type { CustomerProfile, UpdateCustomerProfilePayload } from '../models/customer-profile.models';

@Component({
  selector: 'app-customer-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule, PhoneMaskDirective, StoreHeaderComponent],
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
    phone: ['', [phoneValidator()]],
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

  // Returns pt-BR validation message for phone or email control.
  protected getControlMessage(controlName: keyof typeof this.profileForm.controls): string {
    const control = this.profileForm.controls[controlName];
    if (control.hasError('phone') && control.getError('phone')?.message) {
      return control.getError('phone').message as string;
    }
    if (control.hasError('email')) {
      return 'Informe um e-mail válido.';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório.';
    }
    return 'Valor inválido.';
  }

  // Applies profile data to the reactive form controls.
  private applyProfile(profile: CustomerProfile): void {
    this.profileForm.patchValue({
      cpf: this.formatCpfDisplay(profile.cpf),
      fullName: profile.fullName,
      birthDate: profile.birthDate,
      email: profile.email,
      phone: profile.phone ? this.formatPhoneDisplay(profile.phone) : '',
      street: profile.address.street,
      streetNumber: profile.address.streetNumber,
      neighborhood: profile.address.neighborhood,
      city: profile.address.city,
      state: profile.address.state,
      postalCode: profile.address.postalCode,
      complement: profile.address.complement ?? '',
    });
  }

  // Formats 11-digit CPF string for readonly display (000.000.000-00).
  private formatCpfDisplay(cpf: string): string {
    const d = (cpf ?? '').replace(/\D/g, '');
    if (d.length !== 11) return cpf;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }

  // Formats phone digits for display (00) 00000-0000 or (00) 0000-0000.
  private formatPhoneDisplay(phone: string): string {
    const d = (phone ?? '').replace(/\D/g, '');
    if (d.length <= 2) return d ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  }

  // Maps form values to the profile update payload format.
  private toUpdatePayload(): UpdateCustomerProfilePayload {
    const values = this.profileForm.getRawValue();
    const phoneDigits = (values.phone ?? '').replace(/\D/g, '').trim();

    return {
      fullName: values.fullName.trim(),
      birthDate: values.birthDate,
      email: values.email.trim(),
      phone: phoneDigits || undefined,
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
