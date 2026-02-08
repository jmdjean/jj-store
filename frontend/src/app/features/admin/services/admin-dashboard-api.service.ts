import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import type { AdminDashboardSummaryResponse } from '../models/admin-dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardApiService {
  private readonly apiService = inject(ApiService);

  // Retrieves the dashboard summary for admin users.
  getSummary() {
    return this.apiService.get<AdminDashboardSummaryResponse>('/admin/dashboard/summary');
  }
}
