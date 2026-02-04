export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string | null;
  price: number;
  weightGrams: number | null;
  available: boolean;
  stockQuantity: number;
};

export type ProductDetail = ProductSummary;

export type ProductFiltersInput = {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
  pageSize?: string;
};

export type ProductListResponse = {
  data: ProductSummary[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type ProductDetailResponse = {
  data: ProductDetail;
};
