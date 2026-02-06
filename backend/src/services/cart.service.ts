import { AppError } from '../common/app-error.js';
import { runInTransaction } from '../config/database.js';
import { RagSyncService, type RagOrderItemSyncInput } from './rag-sync.service.js';
import { RagRepository } from '../repositories/rag.repository.js';
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
type TransactionRunner = typeof runInTransaction;

export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly transactionRunner: TransactionRunner = runInTransaction,
    private readonly ragSyncService: RagSyncService = new RagSyncService(new RagRepository()),
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

      const ragOrderItems: RagOrderItemSyncInput[] = [];

      for (const item of plannedItems) {
        const orderItemId = await this.cartRepository.createOrderItem(query, {
          orderId,
          productId: item.productId,
          productName: item.productName,
          productCategory: item.productCategory,
          unitPriceCents: item.unitPriceCents,
          quantity: item.quantity,
          lineTotalCents: item.lineTotalCents,
        });

        ragOrderItems.push({
          id: orderItemId,
          orderId,
          productId: item.productId,
          productName: item.productName,
          productCategory: item.productCategory,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
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

      const orderUpdatedAt = new Date().toISOString();

      await this.ragSyncService.syncOrder(
        {
          id: orderId,
          customerId: normalizedCustomerId,
          status: 'CREATED',
          totalAmountCents,
          itemsCount: plannedItems.length,
          shippingCity: shippingAddress.city,
          shippingState: shippingAddress.state,
          updatedAt: orderUpdatedAt,
        },
        ragOrderItems,
        query,
      );

      await Promise.all(
        ragOrderItems.map((item) => this.ragSyncService.syncOrderItem(item, query)),
      );

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

}
