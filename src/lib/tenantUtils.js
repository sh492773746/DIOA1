import { supabase } from '@/lib/customSupabaseClient';

export const useTenantUtils = () => {

    const logTenantInfo = (hostname, tenantId) => {
        console.groupCollapsed(`%c[Tenant Context] Host: ${hostname}`, 'color: #8A2BE2; font-weight: bold;');
        console.log(`%cResolved Tenant ID: %c${tenantId}`, 'color: #4CAF50;', 'font-weight: bold;');
        console.log(`%cIs Main Site: %c${tenantId === 0}`, 'color: #FF5722;', 'font-weight: bold;');
        console.groupEnd();
    };

    const fetchTenantDetails = async (tenantId) => {
        if (!tenantId || tenantId === 0) return { name: 'Main Site' };
        const { data, error } = await supabase
            .from('tenant_requests')
            .select('desired_domain')
            .eq('id', tenantId)
            .single();

        if (error) {
            console.error('Error fetching tenant details:', error);
            return null;
        }
        return { name: data.desired_domain };
    };

    return { logTenantInfo, fetchTenantDetails };
};