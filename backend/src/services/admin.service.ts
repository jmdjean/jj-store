import { AppError } from '../common/app-error.js';
import { runInTransaction, type QueryExecutor } from '../config/database.js';
import {
  AdminRepository,
  type AdminOrderItemSnapshot,
  type AdminOrderSnapshot,
  type AdminPainelData,
  type AdminProductSnapshot,
} from '../repositories/admin.repository.js';
import {
  ProductCategoriesRepository,
  type ProductCategorySnapshot,
} from '../repositories/product-categories.repository.js';
import type {
  AdminOrderStatus,
  AdminOrderStatusMutationResponse,
  AdminOrderSummary,
  AdminOrdersFiltersInput,
  AdminOrdersListResponse,
  AdminProductDeleteResponse,
  AdminProductDetailResponse,
  AdminProductMutationResponse,
  AdminProductPayloadInput,
  AdminProductsFiltersInput,
  AdminProductsListResponse,
  AdminProductSummary,
  UpdateAdminOrderStatusInput,
} from './admin.types.js';
import { RagRepository } from '../repositories/rag.repository.js';
import { RagSyncService, type RagOrderItemSyncInput } from './rag-sync.service.js';

type TransactionRunner = typeof runInTransaction;



type NormalizedAdminOrdersFilters = {
  status: AdminOrderStatus | 'all';
  customer: string | null;
  fromDate: string | null;
  toDate: string | null;
};

const ADMIN_ORDER_STATUS_TRANSITIONS: Record<AdminOrderStatus, readonly AdminOrderStatus[]> = {
  CREATED: ['PAID', 'CANCELED'],
  PAID: ['PICKING', 'CANCELED'],
  PICKING: ['SHIPPED', 'CANCELED'],
  SHIPPED: ['DELIVERED', 'CANCELED'],
  DELIVERED: [],
  CANCELED: [],
};

type NormalizedAdminProductPayload = {
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  quantity: number;
  weightGrams: number | null;
  purchasePriceCents: number;
  salePriceCents: number;
  imageUrl: string | null;
};

export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly transactionRunner: TransactionRunner = runInTransaction,
    private readonly ragSyncService: RagSyncService = new RagSyncService(new RagRepository()),
    private readonly productCategoriesRepository: ProductCategoriesRepository = new ProductCategoriesRepository(),
  ) {}

  // Retrieves administrative panel data from the repository.
  getPainelData(): AdminPainelData {
    return this.adminRepository.getPainelData();
  }

  // Lists admin products with search and status filters.
  async listProducts(input: AdminProductsFiltersInput): Promise<AdminProductsListResponse> {
    const filters = this.normalizeFilters(input);
    const products = await this.adminRepository.listProducts(filters);

    return {
      data: products.map((product) => this.toProductSummary(product)),
    };
  }

  // Returns one admin product by ID for edit form preloading.
  async getProductById(productId: string): Promise<AdminProductDetailResponse> {
    const normalizedProductId = this.requireProductId(productId);
    const product = await this.adminRepository.findProductById(normalizedProductId);

    if (!product) {
      throw new AppError(404, 'Produto não encontrado.');
    }

    return {
      data: this.toProductSummary(product),
    };
  }



  // Lists admin orders with customer, status, and date filters.
  async listOrders(input: AdminOrdersFiltersInput): Promise<AdminOrdersListResponse> {
    const filters = this.normalizeOrdersFilters(input);
    const orders = await this.adminRepository.listOrders(filters);
    const orderItems = await this.adminRepository.listOrderItemsByOrderIds(orders.map((order) => order.id));

    const itemsByOrder = new Map<string, AdminOrderItemSnapshot[]>();

    for (const item of orderItems) {
      const currentItems = itemsByOrder.get(item.orderId) ?? [];
      currentItems.push(item);
      itemsByOrder.set(item.orderId, currentItems);
    }

    return {
      data: orders.map((order) => this.toOrderSummary(order, itemsByOrder.get(order.id) ?? [])),
    };
  }

  // Updates one order status with transition validation, audit, and RAG sync.
  async updateOrderStatus(
    actorUserId: string,
    orderId: string,
    payload: UpdateAdminOrderStatusInput,
  ): Promise<AdminOrderStatusMutationResponse> {
    const normalizedActorUserId = this.requireActorUserId(actorUserId);
    const normalizedOrderId = this.requireOrderId(orderId);
    const nextStatus = this.parseOrderStatus(payload.status);

    const updatedOrder = await this.transactionRunner(async (query) => {
      const currentOrder = await this.adminRepository.findOrderById(query, normalizedOrderId, true);

      if (!currentOrder) {
        throw new AppError(404, 'Pedido não encontrado.');
      }

      this.ensureAllowedStatusTransition(currentOrder.status, nextStatus);

      const updated = await this.adminRepository.updateOrderStatus(query, currentOrder.id, nextStatus);
      const orderItems = await this.adminRepository.listOrderItems(query, currentOrder.id);

      await this.adminRepository.insertAuditLog(query, {
        actorUserId: normalizedActorUserId,
        entityType: 'order',
        entityId: updated.id,
        action: 'ORDER_STATUS_UPDATED_BY_ADMIN',
        payloadJson: {
          previousStatus: currentOrder.status,
          status: updated.status,
          customerId: updated.customerId,
          totalAmountCents: updated.totalAmountCents,
        },
      });

      const ragOrderItems: RagOrderItemSyncInput[] = orderItems.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName,
        productCategory: item.productCategory,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
      }));

      await this.ragSyncService.syncOrder(
        {
          id: updated.id,
          customerId: updated.customerId,
          status: updated.status,
          totalAmountCents: updated.totalAmountCents,
          itemsCount: updated.itemsCount,
          shippingCity: updated.shippingCity,
          shippingState: updated.shippingState,
          updatedAt: updated.updatedAt.toISOString(),
        },
        ragOrderItems,
        query,
      );

      return { order: updated, items: orderItems };
    });

    return {
      mensagem: 'Status do pedido atualizado com sucesso.',
      data: this.toOrderSummary(updatedOrder.order, updatedOrder.items),
    };
  }


  // Creates a product, records audit entry, and syncs vector index.
  async createProduct(
    actorUserId: string,
    payload: AdminProductPayloadInput,
  ): Promise<AdminProductMutationResponse> {
    const normalizedActorUserId = this.requireActorUserId(actorUserId);

    const product = await this.transactionRunner(async (query) => {
      const normalizedPayload = await this.normalizePayload(payload, query);
      const slug = await this.createUniqueSlug(query, normalizedPayload.name);

      const createdProduct = await this.adminRepository.createProduct(query, {
        slug,
        name: normalizedPayload.name,
        description: normalizedPayload.description,
        categoryId: normalizedPayload.categoryId,
        categoryName: normalizedPayload.categoryName,
        category: normalizedPayload.categoryName,
        imageUrl: normalizedPayload.imageUrl,
        purchasePriceCents: normalizedPayload.purchasePriceCents,
        salePriceCents: normalizedPayload.salePriceCents,
        weightGrams: normalizedPayload.weightGrams,
        quantity: normalizedPayload.quantity,
      });

      await this.adminRepository.insertAuditLog(query, {
        actorUserId: normalizedActorUserId,
        entityType: 'product',
        entityId: createdProduct.id,
        action: 'PRODUCT_CREATED',
        payloadJson: {
          name: createdProduct.name,
          category: createdProduct.category,
          salePriceCents: createdProduct.salePriceCents,
          stockQuantity: createdProduct.stockQuantity,
        },
      });

      await this.ragSyncService.syncProduct(
        {
          id: createdProduct.id,
          name: createdProduct.name,
          description: createdProduct.description,
          category: createdProduct.category,
          salePriceCents: createdProduct.salePriceCents,
          weightGrams: createdProduct.weightGrams,
          stockQuantity: createdProduct.stockQuantity,
          isActive: createdProduct.isActive,
          updatedAt: createdProduct.updatedAt.toISOString(),
        },
        query,
      );

      return createdProduct;
    });

    return {
      mensagem: 'Produto cadastrado com sucesso.',
      data: this.toProductSummary(product),
    };
  }

  // Updates product and inventory data while keeping audit and RAG in sync.
  async updateProduct(
    actorUserId: string,
    productId: string,
    payload: AdminProductPayloadInput,
  ): Promise<AdminProductMutationResponse> {
    const normalizedActorUserId = this.requireActorUserId(actorUserId);
    const normalizedProductId = this.requireProductId(productId);

    const updatedProduct = await this.transactionRunner(async (query) => {
      const previousProduct = await this.adminRepository.findProductById(normalizedProductId);

      if (!previousProduct) {
        throw new AppError(404, 'Produto não encontrado.');
      }

      const normalizedPayload = await this.normalizePayload(payload, query);
      const product = await this.adminRepository.updateProduct(query, {
        productId: normalizedProductId,
        name: normalizedPayload.name,
        description: normalizedPayload.description,
        categoryId: normalizedPayload.categoryId,
        categoryName: normalizedPayload.categoryName,
        category: normalizedPayload.categoryName,
        imageUrl: normalizedPayload.imageUrl,
        purchasePriceCents: normalizedPayload.purchasePriceCents,
        salePriceCents: normalizedPayload.salePriceCents,
        weightGrams: normalizedPayload.weightGrams,
        quantity: normalizedPayload.quantity,
      });

      if (!product) {
        throw new AppError(404, 'Produto não encontrado.');
      }

      await this.adminRepository.insertAuditLog(query, {
        actorUserId: normalizedActorUserId,
        entityType: 'product',
        entityId: product.id,
        action: 'PRODUCT_UPDATED',
        payloadJson: {
          previous: {
            name: previousProduct.name,
            category: previousProduct.category,
            salePriceCents: previousProduct.salePriceCents,
            stockQuantity: previousProduct.stockQuantity,
            isActive: previousProduct.isActive,
          },
          current: {
            name: product.name,
            category: product.category,
            salePriceCents: product.salePriceCents,
            stockQuantity: product.stockQuantity,
            isActive: product.isActive,
          },
        },
      });

      await this.ragSyncService.syncProduct(
        {
          id: product.id,
          name: product.name,
          description: product.description,
          category: product.category,
          salePriceCents: product.salePriceCents,
          weightGrams: product.weightGrams,
          stockQuantity: product.stockQuantity,
          isActive: product.isActive,
          updatedAt: product.updatedAt.toISOString(),
        },
        query,
      );

      return product;
    });

    return {
      mensagem: 'Produto atualizado com sucesso.',
      data: this.toProductSummary(updatedProduct),
    };
  }

  // Deactivates a product, writes audit, and removes its vector index row.
  async deleteProduct(actorUserId: string, productId: string): Promise<AdminProductDeleteResponse> {
    const normalizedActorUserId = this.requireActorUserId(actorUserId);
    const normalizedProductId = this.requireProductId(productId);

    await this.transactionRunner(async (query) => {
      const product = await this.adminRepository.deactivateProduct(query, normalizedProductId);

      if (!product) {
        throw new AppError(404, 'Produto não encontrado.');
      }

      await this.adminRepository.insertAuditLog(query, {
        actorUserId: normalizedActorUserId,
        entityType: 'product',
        entityId: product.id,
        action: 'PRODUCT_DEACTIVATED',
        payloadJson: {
          name: product.name,
          category: product.category,
          updatedAt: product.updatedAt.toISOString(),
        },
      });

      await this.ragSyncService.deleteDocument('product', product.id, query);
    });

    return {
      mensagem: 'Produto removido com sucesso.',
    };
  }

  // Validates and normalizes the admin product list filters.
  private normalizeFilters(input: AdminProductsFiltersInput) {
    const q = this.normalizeOptionalText(input.q);
    const category = this.normalizeOptionalText(input.category);
    const status = this.normalizeStatus(input.status);

    return { q, category, status };
  }

  // Validates create/update payload and converts numeric fields to database format.
  private async normalizePayload(
    payload: AdminProductPayloadInput,
    query: QueryExecutor,
  ): Promise<NormalizedAdminProductPayload> {
    const name = this.requireText(payload.name, 'Informe o nome do produto.');
    const description = this.requireText(payload.description, 'Informe a descrição do produto.');
    const categoryId = this.requireCategoryId(payload.categoryId);
    const category = await this.requireCategory(query, categoryId);
    const quantity = this.parseQuantity(payload.quantity);
    const weightGrams = this.parseOptionalWeight(payload.weightGrams);
    const purchasePriceCents = this.parseMoney(payload.purchasePrice, 'preço de custo');
    const salePriceCents = this.parseMoney(payload.salePrice, 'preço de venda');
    const imageUrl = this.parseOptionalImageUrl(payload.imageUrl);

    return {
      name,
      description,
      categoryId: category.id,
      categoryName: category.name,
      quantity,
      weightGrams,
      purchasePriceCents,
      salePriceCents,
      imageUrl,
    };
  }

  // Ensures authenticated actor user exists before protected mutations.
  private requireActorUserId(actorUserId: string): string {
    const normalizedActorUserId = actorUserId.trim();

    if (!normalizedActorUserId) {
      throw new AppError(401, 'Usuário não autenticado.');
    }

    return normalizedActorUserId;
  }

  // Ensures route product identifier was provided.
  private requireProductId(productId: string): string {
    const normalizedProductId = productId.trim();

    if (!normalizedProductId) {
      throw new AppError(400, 'Informe um produto válido.');
    }

    return normalizedProductId;
  }

  // Ensures a category identifier was provided for product payloads.
  private requireCategoryId(categoryId: unknown): string {
    if (typeof categoryId !== 'string') {
      throw new AppError(400, 'Informe uma categoria válida.');
    }

    const normalizedCategoryId = categoryId.trim();

    if (!normalizedCategoryId) {
      throw new AppError(400, 'Informe uma categoria válida.');
    }

    return normalizedCategoryId;
  }

  // Loads and validates the referenced product category inside the transaction.
  private async requireCategory(
    query: QueryExecutor,
    categoryId: string,
  ): Promise<ProductCategorySnapshot> {
    const category = await this.productCategoriesRepository.findById(query, categoryId);

    if (!category) {
      throw new AppError(404, 'Categoria não encontrada.');
    }

    return category;
  }



  // Ensures route order identifier was provided.
  private requireOrderId(orderId: string): string {
    const normalizedOrderId = orderId.trim();

    if (!normalizedOrderId) {
      throw new AppError(400, 'Informe um pedido válido.');
    }

    return normalizedOrderId;
  }

  // Normalizes admin order filters from request query parameters.
  private normalizeOrdersFilters(input: AdminOrdersFiltersInput): NormalizedAdminOrdersFilters {
    return {
      status: this.normalizeOrderFilterStatus(input.status),
      customer: this.normalizeOptionalText(input.customer),
      fromDate: this.normalizeDateFilter(input.fromDate, 'inicial'),
      toDate: this.normalizeDateFilter(input.toDate, 'final'),
    };
  }

  // Converts filter status to accepted values for admin order listing.
  private normalizeOrderFilterStatus(value: string | undefined): AdminOrderStatus | 'all' {
    const normalizedValue = value?.trim().toUpperCase();

    if (!normalizedValue || normalizedValue === 'ALL') {
      return 'all';
    }

    if (this.isOrderStatus(normalizedValue)) {
      return normalizedValue;
    }

    throw new AppError(400, 'Informe um status de pedido válido para o filtro.');
  }

  // Validates optional date filter in YYYY-MM-DD format.
  private normalizeDateFilter(value: string | undefined, label: 'inicial' | 'final'): string | null {
    const normalizedValue = value?.trim() ?? '';

    if (!normalizedValue) {
      return null;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
      throw new AppError(400, `Informe uma data ${label} válida no formato AAAA-MM-DD.`);
    }

    return normalizedValue;
  }

  // Parses and validates one order status payload value.
  private parseOrderStatus(value: unknown): AdminOrderStatus {
    if (typeof value !== 'string') {
      throw new AppError(400, 'Informe um status de pedido válido.');
    }

    const normalizedValue = value.trim().toUpperCase();

    if (!this.isOrderStatus(normalizedValue)) {
      throw new AppError(400, 'Informe um status de pedido válido.');
    }

    return normalizedValue;
  }

  // Returns whether the informed string is one supported order status.
  private isOrderStatus(value: string): value is AdminOrderStatus {
    return ['CREATED', 'PAID', 'PICKING', 'SHIPPED', 'DELIVERED', 'CANCELED'].includes(value);
  }

  // Validates v1 order status transitions for admin updates.
  private ensureAllowedStatusTransition(currentStatus: AdminOrderStatus, nextStatus: AdminOrderStatus): void {
    if (currentStatus === nextStatus) {
      return;
    }

    const allowedStatuses = ADMIN_ORDER_STATUS_TRANSITIONS[currentStatus];

    if (allowedStatuses.includes(nextStatus)) {
      return;
    }

    throw new AppError(422, 'Transição de status inválida para este pedido.');
  }


  // Normalizes optional text and returns null when empty.
  private normalizeOptionalText(value: string | undefined): string | null {
    const normalizedValue = value?.trim() ?? '';
    return normalizedValue || null;
  }

  // Normalizes filter status to active/inactive/all accepted values.
  private normalizeStatus(value: string | undefined): 'active' | 'inactive' | 'all' {
    const normalizedValue = value?.trim().toLowerCase();

    if (!normalizedValue || normalizedValue === 'active') {
      return 'active';
    }

    if (normalizedValue === 'inactive' || normalizedValue === 'all') {
      return normalizedValue;
    }

    throw new AppError(400, 'Informe um status de filtro válido.');
  }

  // Validates required textual fields and trims leading/trailing spaces.
  private requireText(value: unknown, message: string): string {
    const normalizedValue = typeof value === 'string' ? value.trim() : '';

    if (!normalizedValue) {
      throw new AppError(400, message);
    }

    return normalizedValue;
  }

  // Parses inventory quantity ensuring integer values greater or equal to zero.
  private parseQuantity(value: unknown): number {
    const parsedValue = this.parseNumber(value, 'quantidade');

    if (!Number.isInteger(parsedValue) || parsedValue < 0) {
      throw new AppError(400, 'A quantidade deve ser um número inteiro maior ou igual a zero.');
    }

    return parsedValue;
  }

  // Parses optional product weight in grams ensuring non-negative numbers.
  private parseOptionalWeight(value: unknown): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const parsedValue = this.parseNumber(value, 'peso');

    if (parsedValue < 0) {
      throw new AppError(400, 'O peso deve ser maior ou igual a zero.');
    }

    return Math.round(parsedValue);
  }

  // Parses product money values and converts decimal input to integer cents.
  private parseMoney(value: unknown, fieldLabel: string): number {
    const parsedValue = this.parseNumber(value, fieldLabel);

    if (parsedValue < 0) {
      throw new AppError(400, `O ${fieldLabel} deve ser maior ou igual a zero.`);
    }

    return Math.round(parsedValue * 100);
  }

  // Parses optional image URL and validates HTTP/HTTPS format.
  private parseOptionalImageUrl(value: unknown): string | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value !== 'string') {
      throw new AppError(400, 'Informe uma URL de imagem válida.');
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return null;
    }

    try {
      const url = new URL(normalizedValue);

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new AppError(400, 'Informe uma URL de imagem válida.');
      }

      return normalizedValue;
    } catch {
      throw new AppError(400, 'Informe uma URL de imagem válida.');
    }
  }

  // Parses numeric values from string or number payload fields.
  private parseNumber(value: unknown, fieldLabel: string): number {
    if (value === undefined || value === null || value === '') {
      throw new AppError(400, `Informe o ${fieldLabel} do produto.`);
    }

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        throw new AppError(400, `Informe um valor válido para ${fieldLabel}.`);
      }

      return value;
    }

    if (typeof value !== 'string') {
      throw new AppError(400, `Informe um valor válido para ${fieldLabel}.`);
    }

    const normalizedValue = value.trim().replace(',', '.');

    if (!normalizedValue) {
      throw new AppError(400, `Informe o ${fieldLabel} do produto.`);
    }

    const parsedValue = Number(normalizedValue);

    if (!Number.isFinite(parsedValue)) {
      throw new AppError(400, `Informe um valor válido para ${fieldLabel}.`);
    }

    return parsedValue;
  }

  // Creates a URL-safe unique slug based on product name.
  private async createUniqueSlug(query: QueryExecutor, name: string): Promise<string> {
    const baseSlug = this.slugify(name);

    if (!baseSlug) {
      throw new AppError(400, 'Informe um nome de produto válido para gerar o slug.');
    }

    let candidateSlug = baseSlug;
    let attempt = 2;

    while (await this.adminRepository.slugExists(query, candidateSlug)) {
      candidateSlug = `${baseSlug}-${attempt}`;
      attempt += 1;
    }

    return candidateSlug;
  }

  // Converts arbitrary text into a canonical slug string.
  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }



  // Maps order and items snapshots to one API-ready admin order response.
  private toOrderSummary(order: AdminOrderSnapshot, items: AdminOrderItemSnapshot[]): AdminOrderSummary {
    return {
      id: order.id,
      customerId: order.customerId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      status: order.status,
      totalAmountCents: order.totalAmountCents,
      itemsCount: order.itemsCount,
      currencyCode: order.currencyCode,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      shippingAddress: {
        street: order.shippingStreet,
        streetNumber: order.shippingStreetNumber,
        neighborhood: order.shippingNeighborhood,
        city: order.shippingCity,
        state: order.shippingState,
        postalCode: order.shippingPostalCode,
        complement: order.shippingComplement,
      },
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productCategory: item.productCategory,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
      })),
    };
  }


  // Maps repository snapshot fields into API-friendly product summary response.
  private toProductSummary(product: AdminProductSnapshot): AdminProductSummary {
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      categoryName: product.categoryName,
      imageUrl: product.imageUrl,
      purchasePrice: product.purchasePriceCents / 100,
      salePrice: product.salePriceCents / 100,
      weightGrams: product.weightGrams,
      stockQuantity: product.stockQuantity,
      isActive: product.isActive,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
