
import { Lead, Product, User, LeadStatus, UserRole, Category, Discount, ProductStatus, AbandonedCart, Sheet } from '../types';

const SUPABASE_URL = 'https://dvwcxwahmhrskzyckmye.supabase.co';
const SUPABASE_KEY = 'sb_publishable_J4WmRMrLevkj25MyO9azyA_sSTOH0Ka';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates'
};

export const supabaseService = {
  // --- LEADS ---
  async getLeads(): Promise<Lead[]> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc`, { method: 'GET', headers });
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id,
        id_num: item.id_num,
        name: `${item.first_name} ${item.last_name}`,
        firstName: item.first_name,
        lastName: item.last_name,
        email: item.email,
        phone: item.phone,
        preferredContact: 'phone',
        company: '',
        country: '',
        region: '',
        city: item.city,
        product_id: item.raw_meta?.product_id || '',
        status: item.status as LeadStatus,
        source: item.source,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    } catch (error) { return []; }
  },

  async syncLead(lead: Lead, product?: Product, extraData?: any) {
    try {
      const payload = {
        id: lead.id,
        id_num: lead.id_num,
        first_name: lead.firstName,
        last_name: lead.lastName,
        email: lead.email || extraData?.email || '',
        phone: lead.phone,
        address: extraData?.address || '',
        city: extraData?.city || '',
        zip_code: extraData?.zipCode || '',
        product_name: product?.title || 'Unknown',
        product_sku: product?.sku || 'N/A',
        total_amount: extraData?.totalAmount || product?.price || 0,
        currency: product?.currency || 'SAR',
        status: lead.status,
        source: lead.source,
        upsells: extraData?.upsells || [],
        raw_meta: { ...lead, ...extraData },
        created_at: lead.createdAt
      };
      // Use id as conflict target for leads
      await fetch(`${SUPABASE_URL}/rest/v1/leads?on_conflict=id`, { method: 'POST', headers, body: JSON.stringify(payload) });
    } catch (e) { console.error(e); }
  },

  async deleteLead(id: string) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${id}`, { method: 'DELETE', headers });
    } catch (e) { console.error(e); }
  },

  // --- PRODUCTS ---
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, { method: 'GET', headers });
      const data = await response.json();
      return data.map((p: any) => ({
        id: p.id,
        id_num: p.id_num,
        title: p.title,
        sku: p.sku,
        price: p.price,
        cost_price: p.cost_price,
        stock: p.stock,
        purchased_stock: p.purchased_stock,
        sold_stock: p.sold_stock,
        description: p.description,
        photo: p.photo,
        allPhotos: p.all_photos || [],
        currency: p.currency,
        status: p.status as ProductStatus,
        category: p.category,
        variants: p.variants || [],
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
    } catch (e) { return []; }
  },

  async syncProduct(p: Product) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/products?on_conflict=id`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: p.id,
          id_num: p.id_num,
          title: p.title,
          sku: p.sku,
          price: p.price,
          cost_price: p.costPrice,
          stock: p.stock,
          purchased_stock: p.purchasedStock,
          sold_stock: p.soldStock,
          description: p.description,
          photo: p.photo,
          all_photos: p.allPhotos,
          currency: p.currency,
          status: p.status,
          category: p.category,
          variants: p.variants,
          updated_at: p.updatedAt,
          created_at: p.createdAt
        })
      });
    } catch (e) { console.error(e); }
  },

  async deleteProduct(id: string) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${id}`, { method: 'DELETE', headers });
    } catch (e) { console.error(e); }
  },

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=*`, { method: 'GET', headers });
      const data = await response.json();
      return data.map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        icon: c.icon,
        createdAt: c.created_at
      }));
    } catch (e) { return []; }
  },

  async syncCategory(c: Category) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/categories?on_conflict=id`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: c.id,
          name: c.name,
          description: c.description,
          icon: c.icon,
          created_at: c.createdAt
        })
      });
    } catch (e) { console.error(e); }
  },

  async deleteCategory(id: string) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/categories?id=eq.${id}`, { method: 'DELETE', headers });
    } catch (e) { console.error(e); }
  },

  // --- DISCOUNTS ---
  async getDiscounts(): Promise<Discount[]> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/discounts?select=*`, { method: 'GET', headers });
      const data = await response.json();
      return data.map((d: any) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        value: d.value,
        appliesTo: d.applies_to,
        status: d.status,
        createdAt: d.created_at
      }));
    } catch (e) { return []; }
  },

  async syncDiscount(d: Discount) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/discounts?on_conflict=id`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: d.id,
          name: d.name,
          type: d.type,
          value: d.value,
          applies_to: d.appliesTo,
          status: d.status,
          created_at: d.createdAt
        })
      });
    } catch (e) { console.error(e); }
  },

  async deleteDiscount(id: string) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/discounts?id=eq.${id}`, { method: 'DELETE', headers });
    } catch (e) { console.error(e); }
  },

  // --- ABANDONED CARTS ---
  async getAbandonedCarts(): Promise<AbandonedCart[]> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/abandoned_carts?select=*`, { method: 'GET', headers });
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        phone: item.phone,
        product_id: item.product_id,
        timestamp: item.timestamp
      }));
    } catch (e) { return []; }
  },

  async syncAbandonedCart(cart: AbandonedCart) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/abandoned_carts?on_conflict=id`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: cart.id,
          name: cart.name,
          phone: cart.phone,
          product_id: cart.product_id,
          timestamp: cart.timestamp
        })
      });
    } catch (e) { console.error(e); }
  },

  // --- SHEETS ---
  async getSheets(): Promise<Sheet[]> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/sheets?select=*`, { method: 'GET', headers });
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        googleSheetUrl: item.google_sheet_url,
        productIds: item.product_ids || [],
        isSyncEnabled: item.is_sync_enabled,
        syncLogs: item.sync_logs || [],
        createdAt: item.created_at
      }));
    } catch (e) { return []; }
  },

  async syncSheet(sheet: Sheet) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/sheets?on_conflict=id`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: sheet.id,
          name: sheet.name,
          google_sheet_url: sheet.googleSheetUrl,
          product_ids: sheet.productIds,
          is_sync_enabled: sheet.isSyncEnabled,
          sync_logs: sheet.syncLogs,
          created_at: sheet.createdAt
        })
      });
    } catch (e) { console.error(e); }
  },

  async deleteSheet(id: string) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/sheets?id=eq.${id}`, { method: 'DELETE', headers });
    } catch (e) { console.error(e); }
  },

  // --- USERS ---
  async getUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/platform_users?select=*`, { method: 'GET', headers });
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        password: item.password,
        role: item.role as UserRole,
        avatar: item.avatar,
        isActive: item.is_active,
        isApproved: item.is_approved,
        createdAt: item.created_at
      }));
    } catch (e) { return []; }
  },

  async syncUser(user: User) {
    try {
      // CRITICAL: We use on_conflict=email to ensure updates by email stick even if ID is lost locally
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/platform_users?on_conflict=email`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
          is_active: user.isActive,
          is_approved: user.isApproved,
          avatar: user.avatar,
          created_at: user.createdAt
        })
      });
      if (!resp.ok) {
        const err = await resp.json();
        console.error("Supabase Sync Error:", err);
      }
    } catch (e) { console.error("Network Error during Sync:", e); }
  },

  async deleteUser(id: string) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/platform_users?id=eq.${id}`, { method: 'DELETE', headers });
    } catch (e) { console.error(e); }
  }
};
