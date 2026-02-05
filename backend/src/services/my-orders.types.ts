export type OrderStatus = 'CREATED' | 'PAID' | 'PICKING' | 'SHIPPED' | 'DELIVERED' | 'CANCELED';

export type ListMyOrdersInput = {
  page?: number;
  pageSize?: number;
};

export type MyOrderSummary = {
  id: string;
  status: OrderStatus;
  currencyCode: string;
  totalAmountCents: number;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
  canCancel: boolean;
};

export type MyOrderItem = {
  id: string;
  productId: string;
  productName: string;
  productCategory: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type MyOrderDetail = MyOrderSummary & {
  shippingAddress: {
    street: string;
    streetNumber: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
    complement: string | null;
  };
  items: MyOrderItem[];
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ListMyOrdersResponse = {
  data: MyOrderSummary[];
  meta: PaginationMeta;
};

export type CancelMyOrderResponse = {
  mensagem: string;
};
