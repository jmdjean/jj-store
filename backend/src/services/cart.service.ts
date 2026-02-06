import { AppError } from '../common/app-error.js';
import { runInTransaction } from '../config/database.js';
import { env } from '../config/env.js';
import {
  CartRepository,
  type CheckoutProductSnapshot,
  type CustomerAddressSnapshot,
} from '../repositories/cart.repository.js';
import type { CheckoutAddressInput, CheckoutInput, CheckoutResponse } from './cart.types.js';

type NormalizedCheckoutItem = {
  productId: string;
  quantity: number;
};

type PlannedOrderItem = {
  productId: string;
  productName: string;
  productCategory: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

const EMBEDDING_DIMENSION = env.embeddingDimension;
type TransactionRunner = typeof runInTransaction;

export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly transactionRunner: TransactionRunner = runInTransaction,
  ) {}

  // Creates an order transaction, decrements stock, and upserts vector document.
  async checkout(customerId: string, input: CheckoutInput): Promise<CheckoutResponse> {
    const normalizedCustomerId = customerId.trim();

    if (!normalizedCustomerId) {
      throw new AppError(401, 'Usuário não autenticado.');
    }

    const normalizedItems = this.validateAndNormalizeItems(input.items);
    const createdOrderId = await this.transactionRunner(async (query) => {
      const profileAddress = await this.cartRepository.findCustomerAddress(query, normalizedCustomerId);
      const shippingAddress = this.resolveShippingAddress(input.address, profileAddress);

      const productIds = normalizedItems.map((item) => item.productId);
      const products = await this.cartRepository.lockProductsForCheckout(query, productIds);
      const productsById = new Map(products.map((product) => [product.id, product]));

      const plannedItems = this.buildPlannedOrderItems(normalizedItems, productsById);
      const totalAmountCents = plannedItems.reduce((sum, item) => sum + item.lineTotalCents, 0);

      const orderId = await this.cartRepository.createOrder(query, {
        customerId: normalizedCustomerId,
        totalAmountCents,
        itemsCount: plannedItems.length,
        address: shippingAddress,
      });

      for (const item of plannedItems) {
        await this.cartRepository.createOrderItem(query, {
          orderId,
          productId: item.productId,
          productName: item.productName,
          productCategory: item.productCategory,
          unitPriceCents: item.unitPriceCents,
          quantity: item.quantity,
          lineTotalCents: item.lineTotalCents,
        });

        const inventoryUpdated = await this.cartRepository.decrementInventory(
          query,
          item.productId,
          item.quantity,
        );

        if (!inventoryUpdated) {
          throw new AppError(409, `Estoque insuficiente para o produto ${item.productName}.`);
        }
      }

      const orderMarkdown = this.buildOrderMarkdown(orderId, shippingAddress, plannedItems, totalAmountCents);
      const orderEmbedding = this.createEmbedding(orderMarkdown);

      await this.cartRepository.upsertRagDocument(query, {
        entityType: 'order',
        entityId: orderId,
        contentMarkdown: orderMarkdown,
        embedding: orderEmbedding,
        sourceUpdatedAt: new Date().toISOString(),
        metadataJson: {
          customerId: normalizedCustomerId,
          totalAmountCents,
          itemsCount: plannedItems.length,
          status: 'CREATED',
        },
      });

      return orderId;
    });

    return {
      mensagem: 'Pedido criado com sucesso.',
      orderId: createdOrderId,
    };
  }

  // Validates checkout items and merges duplicate product IDs into one entry.
  private validateAndNormalizeItems(items: CheckoutInput['items']): NormalizedCheckoutItem[] {
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(400, 'Informe ao menos um item para finalizar a compra.');
    }

    const quantitiesByProductId = new Map<string, number>();

    for (const item of items) {
      const productId = item.productId?.trim() ?? '';
      const quantity = Number(item.quantity);

      if (!productId) {
        throw new AppError(400, 'Produto não encontrado.');
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new AppError(400, 'Informe uma quantidade válida para o item do carrinho.');
      }

      const currentQuantity = quantitiesByProductId.get(productId) ?? 0;
      quantitiesByProductId.set(productId, currentQuantity + quantity);
    }

    return Array.from(quantitiesByProductId.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }

  // Resolves shipping address from payload or authenticated customer profile.
  private resolveShippingAddress(
    address: CheckoutAddressInput | undefined,
    profileAddress: CustomerAddressSnapshot | null,
  ): CustomerAddressSnapshot {
    const hasCustomAddress = this.hasAnyAddressField(address);

    if (hasCustomAddress) {
      return this.validateAddress(address);
    }

    if (!profileAddress) {
      throw new AppError(
        400,
        'Nenhum endereço foi encontrado no perfil. Informe o endereço para concluir o pedido.',
      );
    }

    return profileAddress;
  }

  // Builds order item snapshots and validates product existence and stock.
  private buildPlannedOrderItems(
    normalizedItems: NormalizedCheckoutItem[],
    productsById: Map<string, CheckoutProductSnapshot>,
  ): PlannedOrderItem[] {
    const plannedItems: PlannedOrderItem[] = [];

    for (const item of normalizedItems) {
      const product = productsById.get(item.productId);

      if (!product) {
        throw new AppError(404, 'Produto não encontrado.');
      }

      if (item.quantity > product.availableQuantity) {
        throw new AppError(409, `Estoque insuficiente para o produto ${product.name}.`);
      }

      plannedItems.push({
        productId: product.id,
        productName: product.name,
        productCategory: product.category,
        quantity: item.quantity,
        unitPriceCents: product.priceCents,
        lineTotalCents: product.priceCents * item.quantity,
      });
    }

    return plannedItems;
  }

  // Validates each shipping field and returns a normalized address snapshot.
  private validateAddress(address: CheckoutAddressInput | undefined): CustomerAddressSnapshot {
    const street = this.requireText(address?.street, 'Informe a rua do endereço de entrega.');
    const streetNumber = this.requireText(
      address?.streetNumber,
      'Informe o número do endereço de entrega.',
    );
    const neighborhood = this.requireText(
      address?.neighborhood,
      'Informe o bairro do endereço de entrega.',
    );
    const city = this.requireText(address?.city, 'Informe a cidade do endereço de entrega.');
    const state = this.requireText(address?.state, 'Informe a UF do endereço de entrega.').toUpperCase();
    const postalCode = (address?.postalCode ?? '').replace(/\D/g, '');
    const complement = this.normalizeOptionalText(address?.complement);

    if (state.length !== 2) {
      throw new AppError(400, 'Informe uma UF válida para o endereço de entrega.');
    }

    if (postalCode.length !== 8) {
      throw new AppError(400, 'Informe um CEP válido para o endereço de entrega.');
    }

    return {
      street,
      streetNumber,
      neighborhood,
      city,
      state,
      postalCode,
      complement,
    };
  }

  // Returns true when at least one custom address field was sent in payload.
  private hasAnyAddressField(address: CheckoutAddressInput | undefined): boolean {
    if (!address) {
      return false;
    }

    return Object.values(address).some((value) => (value ?? '').toString().trim().length > 0);
  }

  // Returns trimmed non-empty text or throws an AppError with the provided message.
  private requireText(value: string | undefined, message: string): string {
    const normalizedValue = value?.trim() ?? '';

    if (!normalizedValue) {
      throw new AppError(400, message);
    }

    return normalizedValue;
  }

  // Trims optional text values and returns null when no content is provided.
  private normalizeOptionalText(value: string | undefined): string | null {
    const normalizedValue = value?.trim() ?? '';
    return normalizedValue || null;
  }

  // Builds canonical markdown content to index the order in the vector layer.
  private buildOrderMarkdown(
    orderId: string,
    address: CustomerAddressSnapshot,
    items: PlannedOrderItem[],
    totalAmountCents: number,
  ): string {
    const lines = [
      `# Pedido ${orderId}`,
      '',
      '## Endereço de entrega',
      `- Rua: ${address.street}, ${address.streetNumber}`,
      `- Bairro: ${address.neighborhood}`,
      `- Cidade/UF: ${address.city}/${address.state}`,
      `- CEP: ${address.postalCode}`,
      `- Complemento: ${address.complement ?? 'Sem complemento'}`,
      '',
      '## Itens',
      ...items.map(
        (item) =>
          `- ${item.productName} | categoria: ${item.productCategory} | quantidade: ${item.quantity} | preço unitário: ${this.formatCurrency(item.unitPriceCents)} | subtotal: ${this.formatCurrency(item.lineTotalCents)}`,
      ),
      '',
      `**Total:** ${this.formatCurrency(totalAmountCents)}`,
      '**Status:** CREATED',
    ];

    return lines.join('\n');
  }

  // Formats integer cents into pt-BR currency string for markdown snapshots.
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
