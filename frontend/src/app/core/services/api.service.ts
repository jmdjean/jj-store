import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  // Sends a typed GET request and appends optional query parameters.
  get<TResponse>(
    path: string,
    params?: Record<string, string | number | boolean | null | undefined>,
  ) {
    return this.httpClient.get<TResponse>(`${this.baseUrl}${path}`, {
      params: this.buildHttpParams(params),
    });
  }

  // Sends a typed POST request with the provided payload.
  post<TResponse, TPayload>(path: string, payload: TPayload) {
    return this.httpClient.post<TResponse>(`${this.baseUrl}${path}`, payload);
  }

  // Sends a typed PUT request with the provided payload.
  put<TResponse, TPayload>(path: string, payload: TPayload) {
    return this.httpClient.put<TResponse>(`${this.baseUrl}${path}`, payload);
  }

  // Builds HttpParams from defined and non-empty values only.
  private buildHttpParams(
    params?: Record<string, string | number | boolean | null | undefined>,
  ): HttpParams {
    let httpParams = new HttpParams();

    if (!params) {
      return httpParams;
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return httpParams;
  }
}
