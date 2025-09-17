import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTenant } from '@/contexts/TenantContext';

export const usePageContent = (page, section) => {
  const { isInitialized } = useAuth();
  const { isLoading: isTenantLoading } = useTenant();

  const fetchPageContent = async () => {
    const res = await fetch(`/api/page-content?page=${encodeURIComponent(page)}&section=${encodeURIComponent(section)}`);
    if (!res.ok) throw new Error('Failed to load page content');
    return await res.json();
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pageContent', page, section],
    queryFn: fetchPageContent,
    enabled: isInitialized && !isTenantLoading,
    staleTime: 1000 * 60 * 5, 
  });

  return {
    data: data || [],
    isLoading,
    error,
    refetch,
  };
};