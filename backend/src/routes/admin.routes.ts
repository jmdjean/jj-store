import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { RagController } from '../controllers/rag.controller.js';
import { AdminService } from '../services/admin.service.js';
import { AdminRepository } from '../repositories/admin.repository.js';
import { RagRepository } from '../repositories/rag.repository.js';
import { RagSyncService } from '../services/rag-sync.service.js';
import { authGuard } from '../middlewares/auth.guard.js';
import { roleGuard } from '../middlewares/role.guard.js';

const adminRepository = new AdminRepository();
const adminService = new AdminService(adminRepository);
const adminController = new AdminController(adminService);
const ragRepository = new RagRepository();
const ragSyncService = new RagSyncService(ragRepository);
const ragController = new RagController(ragSyncService);

export const adminRouter = Router();

adminRouter.get('/admin/painel', authGuard, roleGuard(['ADMIN', 'MANAGER']), (request, response) => {
  adminController.getPainel(request, response);
});


adminRouter.get('/admin/orders', authGuard, roleGuard(['ADMIN', 'MANAGER']), (request, response, next) => {
  adminController.listOrders(request, response, next);
});

adminRouter.put('/admin/orders/:id/status', authGuard, roleGuard(['ADMIN', 'MANAGER']), (request, response, next) => {
  adminController.updateOrderStatus(request, response, next);
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

adminRouter.post('/admin/rag/search', authGuard, roleGuard(['ADMIN', 'MANAGER']), (request, response, next) => {
  ragController.search(request, response, next);
});
