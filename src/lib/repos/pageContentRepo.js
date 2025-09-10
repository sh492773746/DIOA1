import { supabase as defaultClient } from '@/lib/customSupabaseClient';

export async function fetchPageSectionContent({ supabase = defaultClient, tenantId, page, section }) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('page_content')
    .select('*')
    .eq('page', page)
    .eq('section', section);

  if (error) throw error;
  const rows = data || [];
  const tenantRows = rows.filter(r => r.tenant_id === tenantId && r.is_active);
  const mainRows = rows.filter(r => r.tenant_id === 0 && r.is_active);
  const effective = tenantRows.length > 0 ? tenantRows : mainRows;

  return effective
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map(item => ({ ...item.content, id: item.id, position: item.position }));
} 