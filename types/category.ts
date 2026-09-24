export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface SubCategory {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}