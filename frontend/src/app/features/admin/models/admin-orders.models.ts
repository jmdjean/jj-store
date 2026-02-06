export type AdminOrderStatus = 'CREATED' | 'PAID' | 'PICKING' | 'SHIPPED' | 'DELIVERED' | 'CANCELED';

export type ApiErrorResponse = {
  mensagem: string;
};

export type AdminOrdersFilters = {
  status?: AdminOrderStatus | 'all';
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

export type AdminOrder = {
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
  data: AdminOrder[];
};

export type UpdateAdminOrderStatusPayload = {
  status: AdminOrderStatus;
};

export type AdminOrderStatusMutationResponse = {
  mensagem: string;
  data: AdminOrder;
};
