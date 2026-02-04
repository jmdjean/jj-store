import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { CustomerProfileApiService } from '../services/customer-profile-api.service';
import type {
  ApiErrorResponse,
  CustomerProfile,
  RegisterCustomerPayload,
  UpdateCustomerProfilePayload,
  UpdateCustomerProfileResponse,
} from '../models/customer-profile.models';

@Injectable({
  providedIn: 'root',
})
export class CustomerProfileFacade {
  private readonly customerProfileApiService = inject(CustomerProfileApiService);
  private readonly profileSignal = signal<CustomerProfile | null>(null);

  readonly profile = computed(() => this.profileSignal());
  readonly registerLoading = signal(false);
  readonly registerMessage = signal('');
  readonly registerError = signal('');
  readonly profileLoading = signal(false);
  readonly profileError = signal('');
  readonly saveLoading = signal(false);
  readonly saveMessage = signal('');
  readonly saveError = signal('');

  // Submits customer registration data and updates feedback signals.
  registerCustomer(payload: RegisterCustomerPayload) {
    this.registerLoading.set(true);
    this.registerError.set('');
    this.registerMessage.set('');

    return this.customerProfileApiService.registerCustomer(payload).pipe(
      tap((response) => {
        this.registerMessage.set(response.mensagem);
      }),
      finalize(() => this.registerLoading.set(false)),
    );
  }

  // Loads the customer profile and stores it in facade state.
  loadProfile() {
    this.profileLoading.set(true);
    this.profileError.set('');

    return this.customerProfileApiService.getProfile().pipe(
      tap((profile) => this.profileSignal.set(profile)),
      finalize(() => this.profileLoading.set(false)),
    );
  }

  // Saves profile changes and syncs updated data in local state.
  updateProfile(payload: UpdateCustomerProfilePayload) {
    this.saveLoading.set(true);
    this.saveError.set('');
    this.saveMessage.set('');

    return this.customerProfileApiService.updateProfile(payload).pipe(
      tap((response: UpdateCustomerProfileResponse) => {
        this.profileSignal.set(response.perfil);
        this.saveMessage.set(response.mensagem);
      }),
      finalize(() => this.saveLoading.set(false)),
    );
  }

  // Extracts a user-friendly API error message with fallback support.
  getApiErrorMessage(error: unknown, fallbackMessage: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    const apiError = error.error as ApiErrorResponse | undefined;
    return apiError?.mensagem ?? fallbackMessage;
  }
}
