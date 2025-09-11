import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTenant } from '@/contexts/TenantContext';

export const usePageContent = (page, section) => {
  const { supabase, isInitialized } = useAuth();
  const { activeTenantId, isLoading: isTenantLoading } = useTenant();

  const fetchPageContent = async () => {
    // The activeTenantId from context is now the source of truth for the client.
    // The RLS policies on the backend will handle the actual data filtering.
    // This query is now much simpler.
    if (activeTenantId === undefined || activeTenantId === null) return [];

    const { data, error } = await supabase
      .from('page_content')
      .select('*')
      .eq('page', page)
      .eq('section', section);

    if (error) {
      console.error(`Error fetching content for ${page}/${section} (tenant: ${activeTenantId}):`, error);
      throw error;
    }
    
    if (!data) return [];
    
    // The RLS policy already provides the correct data, including fallbacks.
    // We just need to process what we receive.
    const tenantContent = data.filter(item => item.tenant_id === activeTenantId);
    const mainContent = data.filter(item => item.tenant_id === 0);

    // If the current tenant has its own content for this section, use it.
    if (tenantContent.length > 0) {
      return tenantContent
        .map(item => ({ ...item.content, id: item.id, position: item.position }))
        .sort((a, b) => a.position - b.position);
    }
    
    // Otherwise, fall back to the main site's content.
    return mainContent
      .map(item => ({ ...item.content, id: item.id, position: item.position }))
      .sort((a, b) => a.position - b.position);
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pageContent', page, section, activeTenantId],
    queryFn: fetchPageContent,
    enabled: isInitialized && !isTenantLoading && activeTenantId !== undefined && activeTenantId !== null && !!supabase,
    staleTime: 1000 * 60 * 5, 
  });

  return {
    data: data || [],
    isLoading,
    error,
    refetch,
  };
};