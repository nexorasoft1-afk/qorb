export type BusinessStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Suspended";

export interface Business {
  id: number;
  ownerId: number | null;
  name: string;
  slug: string;
  description: string | null;

  categoryId: number;
  subCategoryId: number | null;

  governorateId: number;
  cityId: number;
  areaId: number | null;

  address: string | null;

  latitude: string | null;
  longitude: string | null;

  phone: string | null;
  whatsapp: string | null;
  website: string | null;

  priceRange: string | null;

  status: BusinessStatus;

  isVerified: boolean;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}