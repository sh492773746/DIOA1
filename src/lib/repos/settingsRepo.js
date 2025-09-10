import { supabase as defaultClient } from '@/lib/customSupabaseClient';

export async function fetchEffectiveSettings({ supabase = defaultClient, tenantId }) {
  if (!supabase || tenantId === undefined || tenantId === null) return {};

  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value, tenant_id')
    .in('tenant_id', [tenantId, 0]);

  if (error) throw error;
  const rows = data || [];
  const main = new Map();
  const tenant = new Map();
  rows.forEach(r => {
    if (r.tenant_id === 0) main.set(r.key, r.value);
    else if (r.tenant_id === tenantId) tenant.set(r.key, r.value);
  });

  const result = {};
  for (const [k, v] of main) result[k] = v;
  for (const [k, v] of tenant) result[k] = v;
  return result;
} 