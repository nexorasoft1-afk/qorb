export type UserRole =
  | "User"
  | "BusinessOwner"
  | "Admin";

export interface User {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}