import { AdminRepository, type AdminPainelData } from '../repositories/admin.repository.js';

export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  getPainelData(): AdminPainelData {
    return this.adminRepository.getPainelData();
  }
}
