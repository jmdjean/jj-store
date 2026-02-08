import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { RagController } from '../controllers/rag.controller.js';
import { RagBackfillController } from '../controllers/rag-backfill.controller.js';
import { AgentController } from '../controllers/agent.controller.js';
import { AdminDashboardController } from '../controllers/admin-dashboard.controller.js';
import { ProductCategoriesController } from '../controllers/product-categories.controller.js';
import { AdminService } from '../services/admin.service.js';
import { AdminDashboardService } from '../services/admin-dashboard.service.js';
import { AdminRepository } from '../repositories/admin.repository.js';
import { AdminDashboardRepository } from '../repositories/admin-dashboard.repository.js';
import { RagRepository } from '../repositories/rag.repository.js';
import { RagBackfillRepository } from '../repositories/rag-backfill.repository.js';
import { SqlAnalyticsRepository } from '../repositories/sql-analytics.repository.js';
import { ProductCategoriesRepository } from '../repositories/product-categories.repository.js';
import { RagSyncService } from '../services/rag-sync.service.js';
import { RagBackfillService } from '../services/rag-backfill.service.js';
import { ProductCategoriesService } from '../services/product-categories.service.js';
import { McpToolsService } from '../services/mcp-tools.service.js';
import { McpServerService } from '../services/mcp-server.service.js';
import { AgentRouterService } from '../services/agent-router.service.js';
import { authGuard } from '../middlewares/auth.guard.js';
import { roleGuard } from '../middlewares/role.guard.js';

const adminRepository = new AdminRepository();
const productCategoriesRepository = new ProductCategoriesRepository();
const adminService = new AdminService(adminRepository, undefined, undefined, productCategoriesRepository);
const adminController = new AdminController(adminService);
const adminDashboardRepository = new AdminDashboardRepository();
const adminDashboardService = new AdminDashboardService(adminDashboardRepository);
const adminDashboardController = new AdminDashboardController(adminDashboardService);
const productCategoriesService = new ProductCategoriesService(productCategoriesRepository);
const productCategoriesController = new ProductCategoriesController(productCategoriesService);
const ragRepository = new RagRepository();
const ragBackfillRepository = new RagBackfillRepository();
const ragSyncService = new RagSyncService(ragRepository);
const ragBackfillService = new RagBackfillService(ragRepository, ragBackfillRepository, ragSyncService);
const ragController = new RagController(ragSyncService);
const ragBackfillController = new RagBackfillController(ragBackfillService, ragBackfillRepository);
const sqlAnalyticsRepository = new SqlAnalyticsRepository();
const mcpToolsService = new McpToolsService(sqlAnalyticsRepository, ragSyncService, ragRepository);
const mcpServerService = new McpServerService(mcpToolsService);
const agentRouterService = new AgentRouterService(mcpServerService);
const agentController = new AgentController(agentRouterService, mcpServerService);

export const adminRouter = Router();

adminRouter.get('/admin/painel', authGuard, roleGuard(['ADMIN', 'MANAGER']), (request: Request, response: Response) => {
  adminController.getPainel(request, response);
});

adminRouter.get(
  '/admin/dashboard/summary',
  authGuard,
  roleGuard(['ADMIN', 'MANAGER']),
  (request: Request, response: Response, next: NextFunction) => {
    adminDashboardController.getSummary(request, response, next);
  },
);

adminRouter.get(
  '/admin/product-categories',
  authGuard,
  roleGuard(['ADMIN', 'MANAGER']),
  (request: Request, response: Response, next: NextFunction) => {
    productCategoriesController.listCategories(request, response, next);
  },
);


adminRouter.get('/admin/orders', authGuard, roleGuard(['ADMIN', 'MANAGER']), (request: Request, response: Response, next: NextFunction) => {
  adminController.listOrders(request, response, next);
});

adminRouter.put('/admin/orders/:id/status', authGuard, roleGuard(['ADMIN', 'MANAGER']), (request: Request, response: Response, next: NextFunction) => {
  adminController.updateOrderStatus(request, response, next);
});

adminRouter.get('/admin/products', authGuard, roleGuard(['ADMIN', 'MANAGER']), (request: Request, response: Response, next: NextFunction) => {
  adminController.listProducts(request, response, next);
});

adminRouter.get(
  '/admin/products/:id',
  authGuard,
  roleGuard(['ADMIN', 'MANAGER']),
  (request: Request, response: Response, next: NextFunction) => {
    adminController.getProductById(request, response, next);
  },
);

adminRouter.post('/admin/products', authGuard, roleGuard(['ADMIN', 'MANAGER']), (request: Request, response: Response, next: NextFunction) => {
  adminController.createProduct(request, response, next);
});

adminRouter.put(
  '/admin/products/:id',
  authGuard,
  roleGuard(['ADMIN', 'MANAGER']),
  (request: Request, response: Response, next: NextFunction) => {
    adminController.updateProduct(request, response, next);
  },
);

adminRouter.delete(
  '/admin/products/:id',
  authGuard,
  roleGuard(['ADMIN', 'MANAGER']),
  (request: Request, response: Response, next: NextFunction) => {
    adminController.deleteProduct(request, response, next);
  },
);

adminRouter.post('/admin/rag/search', authGuard, roleGuard(['ADMIN', 'MANAGER']), (request: Request, response: Response, next: NextFunction) => {
  ragController.search(request, response, next);
});

adminRouter.post('/admin/rag/backfill', authGuard, roleGuard(['ADMIN']), (request: Request, response: Response, next: NextFunction) => {
  ragBackfillController.runBackfill(request, response, next);
});

adminRouter.post('/admin/rag/reprocess-failures', authGuard, roleGuard(['ADMIN']), (request: Request, response: Response, next: NextFunction) => {
  ragBackfillController.reprocessFailures(request, response, next);
});

adminRouter.get('/admin/rag/backfill/failures', authGuard, roleGuard(['ADMIN']), (request: Request, response: Response, next: NextFunction) => {
  ragBackfillController.listFailures(request, response, next);
});

adminRouter.post('/admin/agent/ask', authGuard, roleGuard(['ADMIN', 'MANAGER']), (request: Request, response: Response, next: NextFunction) => {
  agentController.ask(request, response, next);
});
