
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTenant } from '@/contexts/TenantContext';

export const usePageContent = (page, section) => {
  const { supabase, isInitialized } = useAuth();
  const { activeTenantId, isLoading: isTenantLoading } = useTenant();

  const fetchPageContent = async () => {
    // If tenantId is not yet determined, don't fetch.
    if (activeTenantId === undefined || activeTenantId === null) return [];

    // We query the table directly. The RLS policy now strictly enforces
    // visibility based on the current domain (via get_current_tenant_id_for_rls)
    // and the user's authentication state (for public vs. private content).
    // The frontend no longer needs to handle any fallback logic.
    const { data, error } = await supabase
      .from('page_content')
      .select('*')
      .eq('page', page)
      .eq('section', section)
      .eq('is_active', true) // We should only fetch active content
      .order('position', { ascending: true });

    if (error) {
      // The RLS will return an empty array for non-matching tenants, not an error.
      // An error here is likely a real database or network issue.
      console.error(`Error fetching content for ${page}/${section} (tenant: ${activeTenantId}):`, error);
      throw error;
    }
    
    // The content is already pre-formatted in the `content` jsonb column.
    // We just map it and add the top-level properties like id and position.
    return data.map(item => ({ ...item.content, id: item.id, position: item.position }))
               .sort((a, b) => a.position - b.position);
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pageContent', page, section, activeTenantId],
    queryFn: fetchPageContent,
    // Only enable the query when Supabase is initialized and we have a definitive tenantId.
    enabled: isInitialized && !isTenantLoading && activeTenantId !== undefined && activeTenantId !== null && !!supabase,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    data: data || [],
    isLoading,
    error,
    refetch,
  };
};
