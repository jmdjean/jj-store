import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { RagController } from '../controllers/rag.controller.js';
import { RagBackfillController } from '../controllers/rag-backfill.controller.js';
import { AgentController } from '../controllers/agent.controller.js';
import { AdminService } from '../services/admin.service.js';
import { AdminRepository } from '../repositories/admin.repository.js';
import { RagRepository } from '../repositories/rag.repository.js';
import { RagBackfillRepository } from '../repositories/rag-backfill.repository.js';
import { SqlAnalyticsRepository } from '../repositories/sql-analytics.repository.js';
import { RagSyncService } from '../services/rag-sync.service.js';
import { RagBackfillService } from '../services/rag-backfill.service.js';
import { McpToolsService } from '../services/mcp-tools.service.js';
import { McpServerService } from '../services/mcp-server.service.js';
import { AgentRouterService } from '../services/agent-router.service.js';
import { authGuard } from '../middlewares/auth.guard.js';
import { roleGuard } from '../middlewares/role.guard.js';

const adminRepository = new AdminRepository();
const adminService = new AdminService(adminRepository);
const adminController = new AdminController(adminService);
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

adminRouter.post('/admin/rag/backfill', authGuard, roleGuard(['ADMIN']), (request, response, next) => {
  ragBackfillController.runBackfill(request, response, next);
});

adminRouter.post('/admin/rag/reprocess-failures', authGuard, roleGuard(['ADMIN']), (request, response, next) => {
  ragBackfillController.reprocessFailures(request, response, next);
});

adminRouter.get('/admin/rag/backfill/failures', authGuard, roleGuard(['ADMIN']), (request, response, next) => {
  ragBackfillController.listFailures(request, response, next);
});

adminRouter.post('/admin/agent/ask', authGuard, roleGuard(['ADMIN', 'MANAGER']), (request, response, next) => {
  agentController.ask(request, response, next);
});
