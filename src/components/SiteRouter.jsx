
import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Dashboard from '@/pages/Dashboard';
import TenantDashboard from '@/pages/TenantDashboard';
import GameCenter from '@/pages/GameCenter';
import TenantGameCenter from '@/pages/TenantGameCenter';
import { Loader2 } from 'lucide-react';

const LoadingScreen = () => (
    <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin" />
    </div>
);

const SiteRouter = ({ pageType }) => {
    const { appTenantId, tenantIdLoaded } = useAuth();
    
    if (!tenantIdLoaded) {
        return <LoadingScreen />;
    }

    const isTenant = appTenantId !== null && appTenantId !== 0;

    if (pageType === 'dashboard') {
        return isTenant ? <TenantDashboard /> : <Dashboard />;
    }

    if (pageType === 'game-center') {
        return isTenant ? <TenantGameCenter /> : <GameCenter />;
    }
    
    return <div>Invalid page type</div>;
};

export default SiteRouter;
