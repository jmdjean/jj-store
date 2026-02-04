import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import type {
  CustomerProfile,
  RegisterCustomerPayload,
  RegisterCustomerResponse,
  UpdateCustomerProfilePayload,
  UpdateCustomerProfileResponse,
} from '../models/customer-profile.models';

@Injectable({
  providedIn: 'root',
})
export class CustomerProfileApiService {
  private readonly apiService = inject(ApiService);

  // Registers a new customer with account and address data.
  registerCustomer(payload: RegisterCustomerPayload) {
    return this.apiService.post<RegisterCustomerResponse, RegisterCustomerPayload>(
      '/auth/register-customer',
      payload,
    );
  }

  // Fetches the authenticated customer's profile.
  getProfile() {
    return this.apiService.get<CustomerProfile>('/me/profile');
  }

  // Updates the authenticated customer's profile information.
  updateProfile(payload: UpdateCustomerProfilePayload) {
    return this.apiService.put<UpdateCustomerProfileResponse, UpdateCustomerProfilePayload>(
      '/me/profile',
      payload,
    );
  }
}
