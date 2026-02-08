export type AdminProductCategory = {
  id: string;
  name: string;
  slug: string | null;
};

export type AdminProductCategoriesResponse = {
  data: AdminProductCategory[];
};
