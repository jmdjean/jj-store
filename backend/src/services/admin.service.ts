import { AdminRepository, type AdminPainelData } from '../repositories/admin.repository.js';
import { RagService, type RagSearchInput, type RagSearchResponse } from './rag.service.js';

export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly ragService: RagService,
  ) {}

  // Retrieves administrative panel data from the repository.
  getPainelData(): AdminPainelData {
    return this.adminRepository.getPainelData();
  }

  // Synchronizes entities and performs semantic search for ADMIN/MANAGER users.
  async searchRag(input: RagSearchInput): Promise<RagSearchResponse> {
    await this.ragService.syncAllEntities();
    return this.ragService.search(input);
  }
}
