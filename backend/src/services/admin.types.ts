export type AdminProductSummary = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  imageUrl: string | null;
  purchasePrice: number;
  salePrice: number;
  weightGrams: number | null;
  stockQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminProductsFiltersInput = {
  q?: string;
  category?: string;
  status?: string;
};

export type AdminProductPayloadInput = {
  name?: string;
  description?: string;
  categoryId?: string;
  quantity?: unknown;
  weightGrams?: unknown;
  purchasePrice?: unknown;
  salePrice?: unknown;
  imageUrl?: unknown;
};

export type AdminProductsListResponse = {
  data: AdminProductSummary[];
};

export type AdminProductDetailResponse = {
  data: AdminProductSummary;
};

export type AdminProductMutationResponse = {
  mensagem: string;
  data: AdminProductSummary;
};

export type AdminProductDeleteResponse = {
  mensagem: string;
};

export type AdminOrderStatus =
  | 'CREATED'
  | 'PAID'
  | 'PICKING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELED';

export type AdminOrdersFiltersInput = {
  status?: string;
  customer?: string;
  fromDate?: string;
  toDate?: string;
};

export type AdminOrderItem = {
  id: string;
  productId: string;
  productName: string;
  productCategory: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type AdminOrderSummary = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  status: AdminOrderStatus;
  totalAmountCents: number;
  itemsCount: number;
  currencyCode: string;
  createdAt: string;
  updatedAt: string;
  shippingAddress: {
    street: string;
    streetNumber: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
    complement: string | null;
  };
  items: AdminOrderItem[];
};

export type AdminOrdersListResponse = {
  data: AdminOrderSummary[];
};

export type UpdateAdminOrderStatusInput = {
  status?: unknown;
};

export type AdminOrderStatusMutationResponse = {
  mensagem: string;
  data: AdminOrderSummary;
};
