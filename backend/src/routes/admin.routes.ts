import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { AdminService } from '../services/admin.service.js';
import { AdminRepository } from '../repositories/admin.repository.js';
import { authGuard } from '../middlewares/auth.guard.js';
import { roleGuard } from '../middlewares/role.guard.js';

const adminRepository = new AdminRepository();
const adminService = new AdminService(adminRepository);
const adminController = new AdminController(adminService);

export const adminRouter = Router();

adminRouter.get(
  '/admin/painel',
  authGuard,
  roleGuard(['ADMIN', 'MANAGER']),
  (request, response) => {
    adminController.getPainel(request, response);
  },
);
