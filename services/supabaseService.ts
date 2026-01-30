
import { Lead, Product, User } from '../types';

const SUPABASE_URL = 'https://dvwcxwahmhrskzyckmye.supabase.co';
const SUPABASE_KEY = 'sb_publishable_J4WmRMrLevkj25MyO9azyA_sSTOH0Ka';

export const supabaseService = {
  /**
   * Syncs a lead/order to the Supabase database.
   */
  async syncLead(lead: Lead, product?: Product, extraData?: any) {
    try {
      const payload = {
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
        raw_meta: { ...lead, ...extraData }
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Supabase error: ${response.statusText}`);
      return { success: true };
    } catch (error) {
      console.error('Supabase Sync Error (Leads):', error);
      return { success: false, error };
    }
  },

  /**
   * Syncs a platform user to the Supabase database.
   */
  async syncUser(user: User) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/platform_users`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
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

      if (!response.ok) throw new Error(`Supabase error: ${response.statusText}`);
      return { success: true };
    } catch (error) {
      console.error('Supabase Sync Error (Users):', error);
      return { success: false, error };
    }
  }
};
