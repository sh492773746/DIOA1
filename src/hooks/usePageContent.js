import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { fetchPageSectionContent } from '@/lib/repos/pageContentRepo';

export const usePageContent = (page, section) => {
  const { supabase, isInitialized } = useAuth();
  const { activeTenantId, isLoading: isTenantLoading } = useTenant();

  const fetcher = async () => {
    if (activeTenantId === undefined || activeTenantId === null) return [];
    return await fetchPageSectionContent({ supabase, tenantId: activeTenantId, page, section });
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pageContent', page, section, activeTenantId],
    queryFn: fetcher,
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