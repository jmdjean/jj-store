import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  get<TResponse>(path: string) {
    return this.httpClient.get<TResponse>(`${this.baseUrl}${path}`);
  }

  post<TResponse, TPayload>(path: string, payload: TPayload) {
    return this.httpClient.post<TResponse>(`${this.baseUrl}${path}`, payload);
  }
}
