import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { AdminService } from '../services/admin.service.js';
import { AdminRepository } from '../repositories/admin.repository.js';
import { authGuard } from '../middlewares/auth.guard.js';
import { roleGuard } from '../middlewares/role.guard.js';
import { RagService } from '../services/rag.service.js';
import { RagRepository } from '../repositories/rag.repository.js';

const adminRepository = new AdminRepository();
const ragRepository = new RagRepository();
const ragService = new RagService(ragRepository);
const adminService = new AdminService(adminRepository, ragService);
const adminController = new AdminController(adminService);

export const adminRouter = Router();

adminRouter.get('/admin/painel', authGuard, roleGuard(['ADMIN', 'MANAGER']), (request, response) => {
  adminController.getPainel(request, response);
});

adminRouter.post(
  '/admin/rag/search',
  authGuard,
  roleGuard(['ADMIN', 'MANAGER']),
  (request, response, next) => {
    adminController.searchRag(request, response, next);
  },
);
