export enum ProductStatus {
  ACTIVE = 'Active',
  DRAFT = 'Draft',
  ARCHIVED = 'Archived'
}

export enum LeadStatus {
  NEW = 'new',
  CONFIRMED = 'confirmed',
  CALL_LATER = 'call later',
  CALL_LATER_SCHEDULED = 'call later scheduled',
  NO_REPLY = 'no reply',
  CANCELLED = 'cancelled',
  WRONG = 'wrong',
  EXPIRED = 'expired',
  PROCESSING = 'processing',
  DELAYED = 'delayed',
  CANCELLED_PRICE = 'cancelled price',
  BLACK_LISTED = 'Black listed'
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  createdAt: string;
}

export interface Discount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  appliesTo: 'all' | string[]; // 'all' or array of product IDs
  status: 'active' | 'scheduled' | 'expired';
  createdAt: string;
}

export interface Product {
  id: string;
  id_num: string;
  title: string;
  sku: string;
  price: number;
  costPrice: number; // Unit acquisition cost
  backupPrice?: number;
  stock: number; // Current remaining stock
  purchasedStock: number; // Total units ever acquired
  soldStock: number; // Total units confirmed/sold
  description: string;
  photo: string;
  allPhotos: string[];
  url?: string;
  currency: string;
  stockStatus: string;
  status: ProductStatus;
  category: string; // Product category
  upsellIds: string[]; // Linked products for "Frequently Bought Together"
  discountType: 'none' | 'percentage' | 'fixed';
  discountValue: number;
  confirmationRate: number; // Percentage
  deliveryRate: number; // Percentage
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  id_num: string;
  name: string; // Composite: firstName + lastName
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContact: 'phone' | 'email' | 'both';
  company: string;
  country: string;
  region: string;
  city: string;
  product_id: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AbandonedCart {
  id: string;
  name: string;
  phone: string;
  product_id: string;
  timestamp: string;
}

export type SectionType = 'hero' | 'grid' | 'banner' | 'footer' | 'testimonials';

export interface StoreSection {
  id: string;
  type: SectionType;
  content: any;
}

export interface Store {
  id: string;
  name: string;
  logo: string;
  banner: string;
  sections: StoreSection[];
  social: {
    wa: string;
    ig: string;
    fb: string;
  };
  createdAt: string;
}