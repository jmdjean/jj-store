import type { CustomerAddress } from '../../customer/models/customer-profile.models';

export type CartProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stockQuantity: number;
};

export type CartItem = CartProduct & {
  quantity: number;
};

export type CartItemCheckoutInput = {
  productId: string;
  quantity: number;
};

export type CheckoutPayload = {
  items: CartItemCheckoutInput[];
  address?: CustomerAddress;
};

export type CheckoutResponse = {
  mensagem: string;
  orderId: string;
};

export type ApiErrorResponse = {
  mensagem: string;
  detalhes?: unknown;
};
