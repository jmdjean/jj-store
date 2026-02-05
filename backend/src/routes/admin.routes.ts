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

adminRouter.get('/admin/products', authGuard, roleGuard(['ADMIN', 'MANAGER']), (request, response, next) => {
  adminController.listProducts(request, response, next);
});

adminRouter.get(
  '/admin/products/:id',
  authGuard,
  roleGuard(['ADMIN', 'MANAGER']),
  (request, response, next) => {
    adminController.getProductById(request, response, next);
  },
);

adminRouter.post('/admin/products', authGuard, roleGuard(['ADMIN', 'MANAGER']), (request, response, next) => {
  adminController.createProduct(request, response, next);
});

adminRouter.put(
  '/admin/products/:id',
  authGuard,
  roleGuard(['ADMIN', 'MANAGER']),
  (request, response, next) => {
    adminController.updateProduct(request, response, next);
  },
);

adminRouter.delete(
  '/admin/products/:id',
  authGuard,
  roleGuard(['ADMIN', 'MANAGER']),
  (request, response, next) => {
    adminController.deleteProduct(request, response, next);
  },
);
