import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export const getTenantIdByHostname = async (hostname) => {
    try {
        const res = await fetch(`/api/tenant/resolve?host=${encodeURIComponent(hostname)}`);
        if (!res.ok) return 0;
        const j = await res.json();
        const id = Number(j?.tenantId || 0);
        return Number.isFinite(id) ? id : 0;
    } catch (e) {
        console.error(`Error resolving tenant for "${hostname}":`, e);
        return 0;
    }
};