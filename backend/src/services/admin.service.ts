import { AppError } from '../common/app-error.js';
import { runInTransaction, type QueryExecutor } from '../config/database.js';
import {
  AdminRepository,
  type AdminPainelData,
  type AdminProductSnapshot,
} from '../repositories/admin.repository.js';
import type {
  AdminProductDeleteResponse,
  AdminProductDetailResponse,
  AdminProductMutationResponse,
  AdminProductPayloadInput,
  AdminProductsFiltersInput,
  AdminProductsListResponse,
  AdminProductSummary,
} from './admin.types.js';

const EMBEDDING_DIMENSION = 8;

type TransactionRunner = typeof runInTransaction;

type NormalizedAdminProductPayload = {
  name: string;
  description: string;
  category: string;
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

  // Creates a product, records audit entry, and syncs vector index.
  async createProduct(
    actorUserId: string,
    payload: AdminProductPayloadInput,
  ): Promise<AdminProductMutationResponse> {
    const normalizedActorUserId = this.requireActorUserId(actorUserId);
    const normalizedPayload = this.normalizePayload(payload);

    const product = await this.transactionRunner(async (query) => {
      const slug = await this.createUniqueSlug(query, normalizedPayload.name);

      const createdProduct = await this.adminRepository.createProduct(query, {
        slug,
        name: normalizedPayload.name,
        description: normalizedPayload.description,
        category: normalizedPayload.category,
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

      await this.syncProductRag(query, createdProduct);

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
    const normalizedPayload = this.normalizePayload(payload);

    const updatedProduct = await this.transactionRunner(async (query) => {
      const previousProduct = await this.adminRepository.findProductById(normalizedProductId);

      if (!previousProduct) {
        throw new AppError(404, 'Produto não encontrado.');
      }

      const product = await this.adminRepository.updateProduct(query, {
        productId: normalizedProductId,
        name: normalizedPayload.name,
        description: normalizedPayload.description,
        category: normalizedPayload.category,
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

      await this.syncProductRag(query, product);

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

      await this.adminRepository.deleteRagDocument(query, 'product', product.id);
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
  private normalizePayload(payload: AdminProductPayloadInput): NormalizedAdminProductPayload {
    const name = this.requireText(payload.name, 'Informe o nome do produto.');
    const description = this.requireText(payload.description, 'Informe a descrição do produto.');
    const category = this.requireText(payload.category, 'Informe a categoria do produto.');
    const quantity = this.parseQuantity(payload.quantity);
    const weightGrams = this.parseOptionalWeight(payload.weightGrams);
    const purchasePriceCents = this.parseMoney(payload.purchasePrice, 'preço de custo');
    const salePriceCents = this.parseMoney(payload.salePrice, 'preço de venda');
    const imageUrl = this.parseOptionalImageUrl(payload.imageUrl);

    return {
      name,
      description,
      category,
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

  // Generates markdown, embedding, and metadata for product vector sync.
  private async syncProductRag(
    query: QueryExecutor,
    product: AdminProductSnapshot,
  ): Promise<void> {
    const productMarkdown = this.buildProductMarkdown(product);
    const embedding = this.createEmbedding(productMarkdown);

    await this.adminRepository.upsertRagDocument(query, {
      entityType: 'product',
      entityId: product.id,
      contentMarkdown: productMarkdown,
      embedding,
      metadataJson: {
        category: product.category,
        sale_price: product.salePriceCents / 100,
        weight: product.weightGrams,
        updated_at: product.updatedAt.toISOString(),
        is_active: product.isActive,
      },
    });
  }

  // Builds canonical markdown content representing current product state.
  private buildProductMarkdown(product: AdminProductSnapshot): string {
    const lines = [
      `# Produto ${product.name}`,
      '',
      `- ID: ${product.id}`,
      `- Slug: ${product.slug}`,
      `- Categoria: ${product.category}`,
      `- Descrição: ${product.description}`,
      `- Preço de custo: ${this.formatCurrency(product.purchasePriceCents)}`,
      `- Preço de venda: ${this.formatCurrency(product.salePriceCents)}`,
      `- Peso (gramas): ${product.weightGrams ?? 0}`,
      `- Quantidade em estoque: ${product.stockQuantity}`,
      `- Status: ${product.isActive ? 'ATIVO' : 'INATIVO'}`,
      `- Imagem: ${product.imageUrl ?? 'Sem imagem'}`,
    ];

    return lines.join('\n');
  }

  // Formats integer cents into pt-BR currency representation.
  private formatCurrency(valueInCents: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valueInCents / 100);
  }

  // Generates a deterministic fixed-size embedding vector for markdown content.
  private createEmbedding(content: string): number[] {
    const vector = new Array<number>(EMBEDDING_DIMENSION).fill(0);

    for (let index = 0; index < content.length; index += 1) {
      const bucket = index % EMBEDDING_DIMENSION;
      const charCode = content.charCodeAt(index);
      vector[bucket] += (charCode % 97) / 97;
    }

    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

    if (magnitude === 0) {
      return vector;
    }

    return vector.map((value) => value / magnitude);
  }

  // Maps repository snapshot fields into API-friendly product summary response.
  private toProductSummary(product: AdminProductSnapshot): AdminProductSummary {
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      category: product.category,
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

