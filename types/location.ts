export interface Governorate {
  id: number;
  name: string;
  isActive: boolean;
}

export interface City {
  id: number;
  governorateId: number;
  name: string;
  isActive: boolean;
}

export interface Area {
  id: number;
  cityId: number;
  name: string;
  isActive: boolean;
}