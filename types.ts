
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
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
  DELAYED = 'delayed',
  CANCELLED_PRICE = 'cancelled price',
  BLACK_LISTED = 'Black listed'
}

export enum UserRole {
  ADMIN = 'Administrator',
  AGENT = 'Sales Agent (Call Center)',
  LOGISTICS = 'Logistics Agent (Shipping)',
  LIVREUR = 'Delivery Driver (Livreur)',
  LEADER = 'Team Leader',
  MANAGER = 'Account Manager',
  CLIENT = 'Client (User)'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface SupportAttachment {
  type: 'image' | 'video';
  url: string;
}

export interface SupportReply {
  id: string;
  adminId: string;
  adminName: string;
  message: string;
  timestamp: string;
}

export interface SupportRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  attachments?: SupportAttachment[];
  replies?: SupportReply[];
  timestamp: string;
  status: 'pending' | 'resolved';
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  timestamp: string;
  method: string;
  note?: string;
}

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
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
  appliesTo: 'all' | string[];
  status: 'active' | 'scheduled' | 'expired';
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  sku: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  id_num: string;
  title: string;
  sku: string;
  price: number;
  costPrice: number;
  backupPrice?: number;
  stock: number;
  purchasedStock: number;
  soldStock: number;
  description: string;
  photo: string;
  allPhotos: string[];
  url?: string;
  currency: string;
  stockStatus: string;
  status: ProductStatus;
  category: string;
  upsellIds: string[];
  discountType: 'none' | 'percentage' | 'fixed';
  discountValue: number;
  confirmationRate: number;
  deliveryRate: number;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  id_num: string;
  name: string;
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
  source?: 'Manual' | 'Storefront';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  entityName: string;
  status: 'success' | 'failure';
  message: string;
}

export interface Sheet {
  id: string;
  name: string;
  googleSheetUrl: string;
  productIds: string[];
  isSyncEnabled: boolean;
  syncLogs: SyncLog[];
  createdAt: string;
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
