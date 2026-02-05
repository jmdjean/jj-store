import { AdminRepository, type AdminPainelData } from '../repositories/admin.repository.js';

export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  // Retrieves administrative panel data from the repository.
  getPainelData(): AdminPainelData {
    return this.adminRepository.getPainelData();
  }
}
