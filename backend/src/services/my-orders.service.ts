import { AppError } from '../common/app-error.js';
import { runInTransaction, runQuery, type QueryExecutor } from '../config/database.js';
import { env } from '../config/env.js';
import {
  MyOrdersRepository,
  type OrderItemSnapshot,
  type OrderSnapshot,
} from '../repositories/my-orders.repository.js';
import type {
  CancelMyOrderResponse,
  ListMyOrdersInput,
  ListMyOrdersResponse,
  MyOrderDetail,
  MyOrderItem,
  MyOrderSummary,
  OrderStatus,
  PaginationMeta,
} from './my-orders.types.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const CANCELLATION_WINDOW_DAYS = 3;
const EMBEDDING_DIMENSION = env.embeddingDimension;

type TransactionRunner = typeof runInTransaction;
type QueryRunner = typeof runQuery;

export class MyOrdersService {
  constructor(
    private readonly myOrdersRepository: MyOrdersRepository,
    private readonly queryRunner: QueryRunner = runQuery,
    private readonly transactionRunner: TransactionRunner = runInTransaction,
  ) {}

  // Lists authenticated customer orders with pagination metadata.
  async listOrders(customerId: string, input: ListMyOrdersInput): Promise<ListMyOrdersResponse> {
    const normalizedCustomerId = this.requireCustomerId(customerId);
    const pagination = this.normalizePagination(input);
    const offset = (pagination.page - 1) * pagination.pageSize;

    const [orders, totalItems] = await Promise.all([
      this.myOrdersRepository.listOrders(
        this.queryRunner as QueryExecutor,
        normalizedCustomerId,
        pagination.pageSize,
        offset,
      ),
      this.myOrdersRepository.countOrders(this.queryRunner as QueryExecutor, normalizedCustomerId),
    ]);

    return {
      data: orders.map((order) => this.toOrderSummary(order)),
      meta: this.buildPaginationMeta(pagination.page, pagination.pageSize, totalItems),
    };
  }

  // Returns one authenticated customer order with item snapshots.
  async getOrderById(customerId: string, orderId: string): Promise<MyOrderDetail> {
    const normalizedCustomerId = this.requireCustomerId(customerId);
    const normalizedOrderId = this.requireOrderId(orderId);

    const order = await this.myOrdersRepository.findOrderById(
      this.queryRunner as QueryExecutor,
      normalizedCustomerId,
      normalizedOrderId,
    );

    if (!order) {
      throw new AppError(404, 'Pedido não encontrado.');
    }

    const items = await this.myOrdersRepository.listOrderItems(
      this.queryRunner as QueryExecutor,
      normalizedOrderId,
    );

    return this.toOrderDetail(order, items);
  }

  // Cancels an eligible customer order, restores stock, audits, and updates vector index.
  async cancelOrder(customerId: string, orderId: string): Promise<CancelMyOrderResponse> {
    const normalizedCustomerId = this.requireCustomerId(customerId);
    const normalizedOrderId = this.requireOrderId(orderId);

    await this.transactionRunner(async (query) => {
      const order = await this.myOrdersRepository.findOrderById(
        query,
        normalizedCustomerId,
        normalizedOrderId,
        true,
      );

      if (!order) {
        throw new AppError(404, 'Pedido não encontrado.');
      }

      this.ensureOrderCanBeCanceled(order.status, order.createdAt);

      const items = await this.myOrdersRepository.listOrderItems(query, order.id);

      for (const item of items) {
        const inventoryRestored = await this.myOrdersRepository.restoreInventory(
          query,
          item.productId,
          item.quantity,
        );

        if (!inventoryRestored) {
          throw new AppError(409, `Não foi possível retornar o estoque do produto ${item.productName}.`);
        }
      }

      const canceledOrder = await this.myOrdersRepository.updateOrderStatus(query, order.id, 'CANCELED');

      await this.myOrdersRepository.insertAuditLog(query, {
        actorUserId: normalizedCustomerId,
        entityType: 'order',
        entityId: canceledOrder.id,
        action: 'ORDER_CANCELED_BY_CUSTOMER',
        payloadJson: {
          previousStatus: order.status,
          status: canceledOrder.status,
          itemsCount: canceledOrder.itemsCount,
          totalAmountCents: canceledOrder.totalAmountCents,
        },
      });

      const orderMarkdown = this.buildOrderMarkdown(canceledOrder, items);
      const orderEmbedding = this.createEmbedding(orderMarkdown);

      await this.myOrdersRepository.upsertRagDocument(query, {
        entityType: 'order',
        entityId: canceledOrder.id,
        contentMarkdown: orderMarkdown,
        embedding: orderEmbedding,
        sourceUpdatedAt: canceledOrder.updatedAt.toISOString(),
        metadataJson: {
          customerId: normalizedCustomerId,
          totalAmountCents: canceledOrder.totalAmountCents,
          itemsCount: canceledOrder.itemsCount,
          status: canceledOrder.status,
          canceledAt: canceledOrder.updatedAt.toISOString(),
        },
      });
    });

    return {
      mensagem: 'Pedido cancelado com sucesso.',
    };
  }

  // Validates that customer identifier is present for protected operations.
  private requireCustomerId(customerId: string): string {
    const normalizedCustomerId = customerId.trim();

    if (!normalizedCustomerId) {
      throw new AppError(401, 'Usuário não autenticado.');
    }

    return normalizedCustomerId;
  }

  // Validates that order identifier was informed in route params.
  private requireOrderId(orderId: string): string {
    const normalizedOrderId = orderId.trim();

    if (!normalizedOrderId) {
      throw new AppError(400, 'Informe um pedido válido.');
    }

    return normalizedOrderId;
  }

  // Normalizes pagination input with safe defaults and upper bounds.
  private normalizePagination(input: ListMyOrdersInput): { page: number; pageSize: number } {
    const page = Number(input.page ?? DEFAULT_PAGE);
    const pageSize = Number(input.pageSize ?? DEFAULT_PAGE_SIZE);

    if (!Number.isInteger(page) || page < 1) {
      throw new AppError(400, 'Informe uma página válida.');
    }

    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
      throw new AppError(400, `Informe um tamanho de página entre 1 e ${MAX_PAGE_SIZE}.`);
    }

    return {
      page,
      pageSize,
    };
  }

  // Builds pagination metadata for client-side navigation.
  private buildPaginationMeta(page: number, pageSize: number, totalItems: number): PaginationMeta {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      page,
      pageSize,
      totalItems,
      totalPages,
    };
  }

  // Validates business cancellation rules for status and time window.
  private ensureOrderCanBeCanceled(status: OrderStatus, createdAt: Date): void {
    if (status === 'CANCELED') {
      throw new AppError(409, 'Este pedido já foi cancelado.');
    }

    if (status === 'DELIVERED') {
      throw new AppError(422, 'Pedido entregue não pode ser cancelado.');
    }

    const cancellationDeadline = new Date(createdAt.getTime() + CANCELLATION_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    if (Date.now() > cancellationDeadline.getTime()) {
      throw new AppError(422, 'Prazo de cancelamento expirado.');
    }
  }

  // Returns whether an order is currently eligible for customer cancellation.
  private canCancelOrder(status: OrderStatus, createdAt: Date): boolean {
    if (status === 'DELIVERED' || status === 'CANCELED') {
      return false;
    }

    const cancellationDeadline = new Date(createdAt.getTime() + CANCELLATION_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    return Date.now() <= cancellationDeadline.getTime();
  }

  // Maps repository order snapshot to API summary response shape.
  private toOrderSummary(order: OrderSnapshot): MyOrderSummary {
    return {
      id: order.id,
      status: order.status,
      currencyCode: order.currencyCode,
      totalAmountCents: order.totalAmountCents,
      itemsCount: order.itemsCount,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      canCancel: this.canCancelOrder(order.status, order.createdAt),
    };
  }

  // Maps repository order item snapshot to API detail item shape.
  private toOrderItem(item: OrderItemSnapshot): MyOrderItem {
    return {
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productCategory: item.productCategory,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
    };
  }

  // Maps order snapshot plus items to a complete order detail response.
  private toOrderDetail(order: OrderSnapshot, items: OrderItemSnapshot[]): MyOrderDetail {
    return {
      ...this.toOrderSummary(order),
      shippingAddress: {
        street: order.shippingStreet,
        streetNumber: order.shippingStreetNumber,
        neighborhood: order.shippingNeighborhood,
        city: order.shippingCity,
        state: order.shippingState,
        postalCode: order.shippingPostalCode,
        complement: order.shippingComplement,
      },
      items: items.map((item) => this.toOrderItem(item)),
    };
  }

  // Builds canonical markdown content to index the order update in vector storage.
  private buildOrderMarkdown(order: OrderSnapshot, items: OrderItemSnapshot[]): string {
    const lines = [
      `# Pedido ${order.id}`,
      '',
      `**Status:** ${order.status}`,
      `**Total:** ${this.formatCurrency(order.totalAmountCents)}`,
      `**Quantidade de itens:** ${order.itemsCount}`,
      '',
      '## Endereço de entrega',
      `- Rua: ${order.shippingStreet}, ${order.shippingStreetNumber}`,
      `- Bairro: ${order.shippingNeighborhood}`,
      `- Cidade/UF: ${order.shippingCity}/${order.shippingState}`,
      `- CEP: ${order.shippingPostalCode}`,
      `- Complemento: ${order.shippingComplement ?? 'Sem complemento'}`,
      '',
      '## Itens',
      ...items.map(
        (item) =>
          `- ${item.productName} | categoria: ${item.productCategory} | quantidade: ${item.quantity} | preço unitário: ${this.formatCurrency(item.unitPriceCents)} | subtotal: ${this.formatCurrency(item.lineTotalCents)}`,
      ),
    ];

    return lines.join('\n');
  }

  // Formats integer cents into a pt-BR currency string.
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
}
