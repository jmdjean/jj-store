import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import type { RagSearchRequest, RagSearchResponse } from '../models/rag.models';

@Injectable({
  providedIn: 'root',
})
export class RagApiService {
  private readonly apiService = inject(ApiService);

  // Sends semantic search payload to the admin RAG endpoint.
  search(payload: RagSearchRequest) {
    return this.apiService.post<RagSearchResponse, RagSearchRequest>('/admin/rag/search', payload);
  }
}
