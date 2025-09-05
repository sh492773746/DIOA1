import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/customSupabaseClient';
import { fetchWithRetry } from './api';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export const getTenantIdByHostname = async (hostname) => {
    if (!supabase) {
        console.error("Supabase client is not available.");
        return 0; 
    }

    const mainDomain = import.meta.env.VITE_MAIN_DOMAIN;

    // This logic is now corrected. It only considers a hostname as main site if it's localhost or the exact main domain.
    // Preview domains (which don't match mainDomain exactly) will now correctly fall through to the RPC call.
    if (!hostname || hostname === 'localhost' || hostname === mainDomain) {
      return 0; 
    }
  
    const { data, error } = await fetchWithRetry(() => supabase
      .rpc('get_tenant_id_by_hostname', { p_hostname: hostname }));
  
    if (error) {
      console.error('Error fetching tenant ID by hostname:', error);
      return 0; // Fallback to main site on error
    }
    
    // If the RPC returns null (hostname not found in tenant_requests), it's the main site.
    return data !== null ? data : 0;
};