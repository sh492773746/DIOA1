import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { fetchWithRetry } from './api';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export const getTenantIdByHostname = async (hostname) => {
    try {
        const res = await fetch('/api/tenant/resolve');
        if (!res.ok) return 0;
        const j = await res.json();
        return Number.isFinite(Number(j?.tenantId)) ? Number(j.tenantId) : 0;
    } catch (e) {
        console.error(`Critical error in getTenantIdByHostname for "${hostname}":`, e);
        return 0;
    }
};