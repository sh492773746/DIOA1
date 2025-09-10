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
        return 0; // Default to main site if Supabase isn't ready
    }

    try {
        const { data, error } = await fetchWithRetry(() => supabase
            .rpc('get_tenant_id_by_hostname', { p_hostname: hostname })
        );

        if (error) {
            console.error(`Error fetching tenant ID for hostname "${hostname}":`, error);
            return 0; // Fallback to main site on error
        }

        // The RPC function is designed to return 0 for the main site or if no match is found.
        return data;
    } catch (e) {
        console.error(`Critical error in getTenantIdByHostname for "${hostname}":`, e);
        return 0; // Fallback to main site on critical error
    }
};