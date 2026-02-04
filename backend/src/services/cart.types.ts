export type CheckoutItemInput = {
  productId?: string;
  quantity?: number;
};

export type CheckoutAddressInput = {
  street?: string;
  streetNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  complement?: string;
};

export type CheckoutInput = {
  items?: CheckoutItemInput[];
  address?: CheckoutAddressInput;
};

export type CheckoutResponse = {
  mensagem: string;
  orderId: string;
};
